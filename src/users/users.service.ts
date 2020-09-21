import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUserRepository, SupportTeamUserRepository, UserRepository } from './users.repository';
import { MailService } from 'src/auth/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/types/Payload';
import { Token } from 'src/types/Token';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/types/Role';
import { PetitionInfo, ResolutionInfo } from 'src/types/ElementInfo';
import { PetitionRepository } from 'src/petitions/petitions.repository';
import { ResolutionRepository } from 'src/resolutions/resolutions.repository';
import { UserSettingsAndSchoolDto, ChangeUserSettingsDto } from './dto/user-settings.dto';
import { Settings } from 'src/entities/settings.entity';
import { SchoolType } from 'src/types/School';
import { Repository } from 'typeorm';
import { Page } from 'src/types/Page';

const SCHOOL_CHANGE_DAYS = 30;

@Injectable()
export class UserService {

    protectedMail: string;

    constructor(
        private studentUserRepository: StudentUserRepository,
        private supportTeamUserRepository: SupportTeamUserRepository,
        private userRepository: UserRepository,
        private petitionRepository: PetitionRepository,
        private resolutionRepository: ResolutionRepository,
        
        @InjectRepository(Settings)
        private settingsRepository: Repository<Settings>,

        private mailService: MailService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) {
        this.protectedMail = this.configService.get<string>("MY_MAIL");
    }

    async createUser(createUserDto: CreateUserDto): Promise<void>
    {
        let userId: number;

        try
        {
            userId = await this.studentUserRepository.createUser(createUserDto);
        }
        catch(err)
        {
            if (Number(err.code) === 23505) throw new ConflictException("User already exists");
            else throw new BadRequestException("Error while creating user");
        }
        
        const payload: Payload = {
            sub: userId,
            school: createUserDto.school,
            role: Role.Student,
            isAdmin: false,
            isMod: false,
            type: Token.CONFIRMATION
        };

        const token = await this.jwtService.signAsync(payload, { expiresIn: "100y" });
        await this.mailService.sendConfirmationEmail(createUserDto.email, token);
    }


    async updateUserPrivileges(modifyUserPrivilegesDto: ModifyUserDto): Promise<void>
    {
        const { email, admin, moderator, role, active } = modifyUserPrivilegesDto;
        
        const updateQueryObj: QueryDeepPartialEntity<User> = {
            hasAdminPrivileges: admin,
            hasModeratorPrivileges: moderator,
            role: role,
            active: active
        };

        const updateResult = await this.userRepository.update({ email: email }, updateQueryObj);
        if (updateResult.affected === 0) throw new BadRequestException("User does not exist");
    }

    async updateUserRole(modifyUserRoleDto: ModifyUserRoleDto, user: User): Promise<void>
    {
        const { email, role } = modifyUserRoleDto;
        if (user.email !== this.protectedMail && email === this.protectedMail)
        {
            throw new UnauthorizedException("No!");
        }

        const targetUser = await this.userRepository.findOne({ email: email});
        if (!targetUser) throw new BadRequestException("User does not exist");
        if (targetUser.school.campus !== user.school.campus)
        {
            throw new UnauthorizedException("Target user is from other campus");
        }

        await this.userRepository.update(targetUser.id, { role: role });
    }


    async getSavedPetitions(user: User, page: number): Promise<Page<PetitionInfo>>
    {
        const { pageElements: petitions, totalPages } = await this.userRepository.getSavedPetitionsPage(user.id, page);
        const savedPetitionsInfo = await this.petitionRepository.mapPetitionsToAuthPetitionsInfo(petitions, user);
        
        return {
            totalPages: totalPages,
            pageElements: savedPetitionsInfo
        };
    }

    async getSavedResolutions(user: User, page: number): Promise<Page<ResolutionInfo>>
    {
        const { pageElements: resolutions, totalPages } = await this.userRepository.getSavedResolutionsPage(user.id, page);
        const savedResolutionsInfo: ResolutionInfo[] = await this.resolutionRepository.mapResolutionsToAuthResolutionsInfo(resolutions, user);

        return {
            totalPages: totalPages,
            pageElements: savedResolutionsInfo
        };
    }

    getUserSettingsAndSchool(user: User): UserSettingsAndSchoolDto
    {
        return {
            newRes: user.settings.notifyNewResolutions,
            terminated: user.settings.notifyTerminatedResolutions,
            overdue: user.settings.notifyOverdueResolutions,
            school: {
                campus: user.school.campus,
                lastChange: user.school.updatedDate
            }
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
            throw new UnauthorizedException("Your role or privilege doesn't allow switching schools");
        }

        const updatedDate = user.school.updatedDate;
        const limitDate = new Date(updatedDate.getTime() + 1000*60*60*24*SCHOOL_CHANGE_DAYS);
        const nowDate = new Date(Date.now());

        if (nowDate < limitDate) throw new UnauthorizedException("You're not allowed yet to switch your school");
        if (newCampus === user.school.campus) throw new BadRequestException();

        user.school.campus = newCampus;
        await this.userRepository.save(user);
    }
}
