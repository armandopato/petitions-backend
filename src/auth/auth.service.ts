import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { UserCredentials } from './dto/user-credentials.dto';
import { validateOrReject } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { AuthTokens } from 'src/types/AccessObj';
import { Payload } from 'src/types/Payload';
import { ChangePasswordDto } from './dto/change-password.dto';

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

    async generateAuthTokens(user: User): Promise<AuthTokens>
    {
        const payload: Payload = { sub: user.id, school: user.school.campus };
        console.log(`Access and refresh tokens generated for ${user.email}`);
        const access_token = await this.jwtService.signAsync(payload);
        const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: "14d" });

        await this.userRepository.update(user.id, { refreshToken: refresh_token });
        return {
            access_token,
            refresh_token
        };
    }

    async confirmEmail(user: User, confirmationToken: string): Promise<void>
    {
        if (user.confirmationToken === confirmationToken)
        {
            await this.userRepository.update(user.id, { confirmationToken: null });
        }
        else
        {
            throw new UnauthorizedException();
        }
    }

    async changePassword(user: User, changePasswordDto: ChangePasswordDto): Promise<{ userId:number }>
    {
        const password = changePasswordDto.password;
        let newPassword = changePasswordDto.newPassword;

        const match = await compare(password, user.password);
        if (!match) throw new UnauthorizedException();

        newPassword = await hash(newPassword, 10);
        await this.userRepository.update(user.id, { password: newPassword });
        return { userId: user.id };
    }
}