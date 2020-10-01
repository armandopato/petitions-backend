import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUserRepository, SupportTeamUserRepository, UserRepository } from './users.repository';
import { MailService } from 'src/auth/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/types/Payload';
import { Token } from 'src/types/Token';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/types/Role';
import { PetitionInfo, ResolutionInfo } from 'src/types/ElementInfo';
import { ChangeUserSettingsDto, UserSettingsAndSchoolDto } from './dto/user-settings.dto';
import { Settings } from 'src/users/entities/settings.entity';
import { SchoolType } from 'src/types/School';
import { Repository } from 'typeorm';
import { Page } from 'src/types/Page';
import { PetitionsService } from '../posts/petitions/petitions.service';
import { ResolutionsService } from '../posts/resolutions/resolutions.service';

const SCHOOL_CHANGE_DAYS = 30;

@Injectable()
export class UserService
{
	
	protectedMail: string;
	
	constructor(
		private studentUserRepository: StudentUserRepository,
		private supportTeamUserRepository: SupportTeamUserRepository,
		private userRepository: UserRepository,
		private petitionService: PetitionsService,
		private resolutionService: ResolutionsService,
		@InjectRepository(Settings)
		private settingsRepository: Repository<Settings>,
		private mailService: MailService,
		private jwtService: JwtService,
		private configService: ConfigService,
	)
	{
		this.protectedMail = this.configService.get<string>('MY_MAIL');
	}
	
	async createUser(createUserDto: CreateUserDto): Promise<void>
	{
		let userId: number;
		
		try
		{
			userId = await this.studentUserRepository.createUser(createUserDto);
		}
		catch (err)
		{
			if (Number(err.code) === 23505) throw new ConflictException('User already exists');
			else throw new BadRequestException('Error while creating user');
		}
		
		const payload: Payload = {
			sub: userId,
			school: createUserDto.school,
			role: Role.Student,
			isAdmin: false,
			isMod: false,
			type: Token.CONFIRMATION,
		};
		
		const token = await this.jwtService.signAsync(payload, { expiresIn: '100y' });
		await this.mailService.sendConfirmationEmail(createUserDto.email, token);
	}
	
	
	async updateUserPrivileges(modifyUserPrivilegesDto: ModifyUserDto): Promise<void>
	{
		const { email, admin, moderator, role, active } = modifyUserPrivilegesDto;
		
		const updateQueryObj: QueryDeepPartialEntity<User> = {
			hasAdminPrivileges: admin,
			hasModeratorPrivileges: moderator,
			role: role,
			active: active,
		};
		
		const updateResult = await this.userRepository.update({ email: email }, updateQueryObj);
		if (updateResult.affected === 0) throw new BadRequestException('User does not exist');
	}
	
	async updateUserRole(modifyUserRoleDto: ModifyUserRoleDto, user: User): Promise<void>
	{
		const { email, role } = modifyUserRoleDto;
		if (user.email !== this.protectedMail && email === this.protectedMail)
		{
			throw new UnauthorizedException('No!');
		}
		
		const targetUser = await this.userRepository.findOne({ email: email });
		if (!targetUser) throw new BadRequestException('User does not exist');
		if (targetUser.school.campus !== user.school.campus)
		{
			throw new UnauthorizedException('Target user is from other campus');
		}
		
		await this.userRepository.update(targetUser.id, { role: role });
	}
	
	
	async getSavedPetitions(user: User, pageNumber: number): Promise<Page<PetitionInfo>>
	{
		const page = await this.userRepository.getSavedPetitionsPage(user.id, pageNumber);
		return await this.petitionService.pageToInfoPage(page, user);
	}
	
	async getSavedResolutions(user: User, pageNumber: number): Promise<Page<ResolutionInfo>>
	{
		const page = await this.userRepository.getSavedResolutionsPage(user.id, pageNumber);
		return await this.resolutionService.pageToInfoPage(page, user);
	}
	
	getUserSettingsAndSchool(user: User): UserSettingsAndSchoolDto
	{
		return {
			newRes: user.settings.notifyNewResolutions,
			terminated: user.settings.notifyTerminatedResolutions,
			overdue: user.settings.notifyOverdueResolutions,
			school: {
				campus: user.school.campus,
				lastChange: user.school.updatedDate,
			},
		};
	}
	
	async modifyUserSettings(user: User, changeUserSettingsDto: ChangeUserSettingsDto): Promise<void>
	{
		const { newRes, terminated, overdue } = changeUserSettingsDto;
		user.settings.notifyNewResolutions = newRes;
		user.settings.notifyTerminatedResolutions = terminated;
		user.settings.notifyOverdueResolutions = overdue;
		
		await this.userRepository.save(user);
	}
	
	async modifySchool(user: User, newCampus: SchoolType): Promise<void>
	{
		if (user.hasAdminPrivileges || user.hasModeratorPrivileges || user.role === Role.SupportTeam)
		{
			throw new UnauthorizedException('Your role or privilege doesn\'t allow switching schools');
		}
		
		const updatedDate = user.school.updatedDate;
		const limitDate = new Date(updatedDate.getTime() + 1000 * 60 * 60 * 24 * SCHOOL_CHANGE_DAYS);
		const nowDate = new Date(Date.now());
		
		if (nowDate < limitDate) throw new UnauthorizedException('You\'re not allowed yet to switch your school');
		if (newCampus === user.school.campus) throw new BadRequestException();
		
		user.school.campus = newCampus;
		await this.userRepository.save(user);
	}
}
