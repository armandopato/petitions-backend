import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUserRepository, SupportTeamUserRepository } from './users.repository';
import { CreateUserRes } from './dto/create-user-res.dto';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { MailService } from 'src/auth/mail.service';
import { nanoid } from 'nanoid/async';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(StudentUserRepository)
        private studentUserRepository: StudentUserRepository,

        @InjectRepository(SupportTeamUserRepository)
        private supportTeamUserRepository: SupportTeamUserRepository,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        private mailService: MailService
    ) {}

    async createUser(createUserDto: CreateUserDto): Promise<CreateUserRes>
    {
        const { email } = createUserDto;
        const existingUser = await this.userRepository.findOne({ email: email });
        if (existingUser)
        {
            throw new BadRequestException("User already exists");
        }

        const token = await nanoid(60);
        await this.mailService.sendConfirmationEmail(email, token);
        
        return await this.studentUserRepository.createUser(createUserDto, token);
    }
}
