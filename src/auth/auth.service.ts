import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { UserCredentials } from './dto/user-credentials.dto';
import { validateOrReject } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { AccessObj } from 'src/types/AccessObj';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, password: string): Promise<User>
    {
        const userCredentials = new UserCredentials();
        userCredentials.email = email;
        userCredentials.password = password;

        try
        {
            await validateOrReject(userCredentials);
        }
        catch(err)
        {
            throw new UnauthorizedException();
        }

        const user = await this.userRepository.findOne({ email: email });
        if (!user) return null;

        const match = await compare(password, user.password);
        if (!match) return null;

        return user;
    }

    generateJWT(user: User): AccessObj
    {
        const payload = { sub: user.id, school: user.school.campus };
        console.log(`Access token generated for ${user.email}`);
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async confirmEmail(user: User, confirmationToken: string): Promise<AccessObj>
    {
        if (user.confirmationToken === confirmationToken)
        {
            await this.userRepository.update(user.id, { confirmationToken: null });
            return this.generateJWT(user);
        }
        throw new UnauthorizedException();
    }
}