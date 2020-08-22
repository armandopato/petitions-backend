import { Injectable } from '@nestjs/common';
import { UserCredentials } from './dto/user-credentials.dto';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) { }

    async validateUser(userCredentials: UserCredentials): Promise<User>
    {
        const { email, password } = userCredentials;
        const user = await this.userRepository.findOne({ email: email });
        if (!user) return null;

        const match = await compare(password, user.password);
        if (!match) return null;

        return user;
    }
}