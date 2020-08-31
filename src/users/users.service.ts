import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUserRepository, SupportTeamUserRepository, UserRepository } from './users.repository';
import { CreateUserRes } from './dto/create-user-res.dto';
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
import { PetitionsCollection, ResolutionsCollection } from 'src/types/ElementsCollection';
import { ResolutionRepository } from 'src/resolutions/resolutions.repository';
import { ResolutionStatus } from 'src/types/ElementStatus';


@Injectable()
export class UserService {

    protectedMail: string;

    constructor(
        @InjectRepository(StudentUserRepository)
        private studentUserRepository: StudentUserRepository,

        @InjectRepository(SupportTeamUserRepository)
        private supportTeamUserRepository: SupportTeamUserRepository,

        @InjectRepository(UserRepository)
        private userRepository: UserRepository,

        @InjectRepository(PetitionRepository)
        private petitionRepository: PetitionRepository,

        @InjectRepository(ResolutionRepository)
        private resolutionRepository: ResolutionRepository,

        private mailService: MailService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) {
        this.protectedMail = this.configService.get<string>("MY_MAIL");
    }

    async createUser(createUserDto: CreateUserDto): Promise<CreateUserRes>
    {
        let createUserRes: CreateUserRes;

        try
        {
            createUserRes = await this.studentUserRepository.createUser(createUserDto);
        }
        catch(err)
        {
            // Includes user duplication
            console.log(err);
            throw new BadRequestException("Error while creating user");
        }
        
        const payload: Payload = {
            sub: createUserRes.id,
            school: createUserDto.school,
            role: Role.Student,
            isAdmin: false,
            isMod: false,
            type: Token.CONFIRMATION
        };

        const token = await this.jwtService.signAsync(payload, { expiresIn: "100y" });
        await this.mailService.sendConfirmationEmail(createUserRes.email, token);
        
        return createUserRes;
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

    async updateUserRole(modifyUserPrivilegesDto: ModifyUserRoleDto, user: User): Promise<void>
    {
        const { email, role } = modifyUserPrivilegesDto;
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

        await this.userRepository.update({ email: email }, { role: role });
    }


    async getSavedPetitions(user: User, page: number): Promise<PetitionsCollection>
    {
        const { petitions, totalPages } = await this.userRepository.getSavedPetitionsPage(user.id, page);
        const savedPetitionsInfo: PetitionInfo[] = [];
        
        for (const petition of petitions)
        {
            const numVotes = await this.petitionRepository.countNumberOfVotes(petition.id);
            const numComments = await this.petitionRepository.countNumberOfComments(petition.id);
            const didVote = await this.petitionRepository.didUserVote(petition.id, user.id);
            const status = await this.petitionRepository.getPetitionStatus(petition.id);

            savedPetitionsInfo.push({
                id: petition.id,
                title: petition.title,
                date: petition.createdDate,
                numVotes: numVotes,
                numComments: numComments,
                status: status,
                didVote: didVote,
                didSave: true
            });
        } 

        return {
            totalPages: totalPages,
            currentPage: page,
            petitions: savedPetitionsInfo
        };
    }

    async getSavedResolutions(user: User, page: number): Promise<ResolutionsCollection>
    {
        const { resolutions, totalPages } = await this.userRepository.getSavedResolutionsPage(user.id, page);
        const savedResolutionsInfo: ResolutionInfo[] = [];
        for (let i = 0; i < resolutions.length; i++)
        {
            resolutions[i] = await this.resolutionRepository.findOne(resolutions[i].id, { relations: ["petition"] });
        }

        for (const resolution of resolutions)
        {
            const status = this.resolutionRepository.getResolutionStatus(resolution);

            const resolutionInfo: ResolutionInfo = {
                id: resolution.id,
                title: resolution.petition.title,
                status: status,
                didSave: true
            };

            if (status === ResolutionStatus.TERMINATED)
            {
                resolutionInfo.resolutionDate = resolution.resolutionDate;
                resolutionInfo.numRejectionVotes = await this.resolutionRepository.countNumberOfRejectionVotes(resolution.id);
                resolutionInfo.numComments = await this.resolutionRepository.countNumberOfComments(resolution.id);
                resolutionInfo.didVote = await this.resolutionRepository.didUserVote(resolution.id, user.id);
            }
            else
            {
                resolutionInfo.startDate = resolution.startDate;
                resolutionInfo.deadline = resolution.deadline;
            }

            savedResolutionsInfo.push(resolutionInfo);
        } 

        return {
            totalPages: totalPages,
            currentPage: page,
            resolutions: savedResolutionsInfo
        };
    }
}
