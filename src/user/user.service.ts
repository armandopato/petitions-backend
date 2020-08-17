import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentUserRepository, SupportTeamUserRepository } from './user.repository';
import { CreateUserRes } from './dto/create-user-res.dto';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(StudentUserRepository)
        private studentUserRepository: StudentUserRepository,

        @InjectRepository(SupportTeamUserRepository)
        private supportTeamUserRepository: SupportTeamUserRepository,
    ) {}

    async createUser(createUserDto: CreateUserDto): Promise<CreateUserRes>
    {
        return await this.studentUserRepository.createUser(createUserDto);
    }
}
