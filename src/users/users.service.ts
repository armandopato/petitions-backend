import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUsersRepository, UsersRepository } from './users.repository';
import { MailService } from 'src/auth/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/auth/interfaces/payload.interface';
import { Token } from 'src/auth/enums/token.enum';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/users/enums/role.enum';
import { ChangeUserSettingsDto, UserSettingsAndSchoolDto } from './dto/user-settings.dto';
import { SchoolName } from 'src/users/enums/school-name.enum';
import { Page } from 'src/util/page/page.interface';
import { PetitionsService } from '../posts/petitions/petitions.service';
import { ResolutionsService } from '../posts/resolutions/resolutions.service';
import { SCHOOL_CHANGE_MILLISECONDS, UNIQUE_VIOLATION_ERRCODE } from '../util/constants';
import { PetitionInfo } from '../posts/petitions/interfaces/petition-info.interface';
import { ResolutionInfo } from '../posts/resolutions/interfaces/resolution-info.interface';

@Injectable()
export class UsersService
{
    private readonly protectedMail: string;
    private readonly CONFIRMATION_EXPIRATION: string;
    
    constructor(
        private studentUsersRepository: StudentUsersRepository,
        private usersRepository: UsersRepository,
        private petitionsService: PetitionsService,
        private resolutionsService: ResolutionsService,
        private mailService: MailService,
        private jwtService: JwtService,
        private configService: ConfigService,
    )
    {
        this.protectedMail = this.configService.get<string>('MY_MAIL');
        this.CONFIRMATION_EXPIRATION = this.configService.get<string>('CONFIRMATION_EXPIRATION');
    }
    
    async createUser(createUserDto: CreateUserDto): Promise<void>
    {
        let userId: number;
        
        try
        {
            userId = await this.studentUsersRepository.createUser(createUserDto);
        }
        catch (err)
        {
            if (Number(err.code) === UNIQUE_VIOLATION_ERRCODE) throw new ConflictException('User already exists');
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
        
        // Don't implement here
        const token = await this.jwtService.signAsync(payload, { expiresIn: this.CONFIRMATION_EXPIRATION });
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
        
        const updateResult = await this.usersRepository.update({ email: email }, updateQueryObj);
        if (updateResult.affected === 0) throw new BadRequestException('User does not exist');
    }
    
    async updateUserRole(modifyUserRoleDto: ModifyUserRoleDto, user: User): Promise<void>
    {
        const { email, role } = modifyUserRoleDto;
        if (user.email !== this.protectedMail && email === this.protectedMail)
        {
            throw new UnauthorizedException('No!');
        }
        
        const targetUser = await this.usersRepository.findOne({ email: email });
        if (!targetUser) throw new BadRequestException('User does not exist');
        if (targetUser.school.campus !== user.school.campus)
        {
            throw new UnauthorizedException('Target user is from other campus');
        }
        
        await this.usersRepository.update(targetUser.id, { role: role });
    }
    
    
    async getSavedPetitions(user: User, pageNumber: number): Promise<Page<PetitionInfo>>
    {
        const page = await this.usersRepository.getSavedPetitionsPage(user.id, pageNumber);
        return await this.petitionsService.pageToInfoPage(page, user);
    }
    
    async getSavedResolutions(user: User, pageNumber: number): Promise<Page<ResolutionInfo>>
    {
        const page = await this.usersRepository.getSavedResolutionsPage(user.id, pageNumber);
        return await this.resolutionsService.pageToInfoPage(page, user);
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
        const userCopy = { ...user };
        userCopy.settings.notifyNewResolutions = newRes;
        userCopy.settings.notifyTerminatedResolutions = terminated;
        userCopy.settings.notifyOverdueResolutions = overdue;
    
        await this.usersRepository.save(userCopy);
    }
    
    async modifySchool(user: User, newCampus: SchoolName): Promise<void>
    {
        if (user.hasAdminPrivileges || user.hasModeratorPrivileges || user.role === Role.SupportTeam)
        {
            throw new UnauthorizedException('Your role or privilege doesn\'t allow switching schools');
        }
    
        const updatedDate = user.school.updatedDate;
        const limitDate = new Date(updatedDate.getTime() + SCHOOL_CHANGE_MILLISECONDS);
        const nowDate = new Date(Date.now());
    
        if (nowDate < limitDate) throw new UnauthorizedException('You\'re not allowed yet to switch your school');
        if (newCampus === user.school.campus) throw new BadRequestException();
    
        const userCopy = { ...user };
        userCopy.school.campus = newCampus;
        await this.usersRepository.save(userCopy);
    }
}
