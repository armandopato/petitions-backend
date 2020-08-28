import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUserRepository, SupportTeamUserRepository } from './users.repository';
import { CreateUserRes } from './dto/create-user-res.dto';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { MailService } from 'src/auth/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/types/Payload';
import { Token } from 'src/types/Token';


@Injectable()
export class UserService {

    constructor(
        @InjectRepository(StudentUserRepository)
        private studentUserRepository: StudentUserRepository,

        @InjectRepository(SupportTeamUserRepository)
        private supportTeamUserRepository: SupportTeamUserRepository,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        private mailService: MailService,
        private jwtService: JwtService
    ) {}

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
            throw new BadRequestException("Error while creating user");
        }
        
        const payload: Payload = {
            sub: createUserRes.id,
            school: createUserDto.school,
            type: Token.CONFIRMATION
        };

        const token = await this.jwtService.signAsync(payload, { expiresIn: "100y" });
        await this.mailService.sendConfirmationEmail(createUserRes.email, token);
        
        return createUserRes;
    }
}
