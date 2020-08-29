import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUserRepository, SupportTeamUserRepository } from './users.repository';
import { CreateUserRes } from './dto/create-user-res.dto';
import { MailService } from 'src/auth/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/types/Payload';
import { Token } from 'src/types/Token';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Role } from 'src/types/Role';


@Injectable()
export class UserService {

    protectedMail: string;

    constructor(
        @InjectRepository(StudentUserRepository)
        private studentUserRepository: StudentUserRepository,

        @InjectRepository(SupportTeamUserRepository)
        private supportTeamUserRepository: SupportTeamUserRepository,

        @InjectRepository(User)
        private userRepository: Repository<User>,

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
}
