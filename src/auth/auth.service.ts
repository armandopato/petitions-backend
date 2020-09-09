import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { UserCredentials } from './dto/user-credentials.dto';
import { validateOrReject } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { AuthTokens } from 'src/types/AuthTokens';
import { Payload } from 'src/types/Payload';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Token } from 'src/types/Token';
import { MailService } from './mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private mailService: MailService
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
        const accessPayload: Payload = {
            sub: user.id,
            school: user.school.campus,
            role: user.role,
            isAdmin: user.hasAdminPrivileges,
            isMod: user.hasModeratorPrivileges,
            type: Token.ACCESS
        };
        const refreshPayload: Payload = { ...accessPayload, type: Token.REFRESH};
        
        const access_token = await this.jwtService.signAsync(accessPayload, { expiresIn: "15m" });
        const refresh_token = await this.jwtService.signAsync(refreshPayload, { expiresIn: "14d" });

        return {
            access_token,
            refresh_token
        };
    }

    async confirmEmail(user: User, confirmationToken: string): Promise<void>
    {
        try
        {
            const { sub, type }: Payload = await this.jwtService.verifyAsync(confirmationToken);
            if (type !== Token.CONFIRMATION) throw new Error();
            await this.userRepository.update(sub, { active: true });
            console.log(`${user.email} (EMAIL CONFIRMED)`);
        }
        catch(err)
        {
            console.log(`${user.email} (INVALID CONFIRMATION TOKEN)`);
            throw new UnauthorizedException();
        }
    }

    async changePassword(user: User, changePasswordDto: ChangePasswordDto): Promise<void>
    {
        const password = changePasswordDto.password;
        let newPassword = changePasswordDto.newPassword;

        const match = await compare(password, user.password);
        if (!match) throw new UnauthorizedException();

        newPassword = await hash(newPassword, 10);
        await this.userRepository.update(user.id, { password: newPassword });
        console.log(`${user.email} (PASSWORD CHANGED)`);
    }

    async sendPasswordResetToken(email: string): Promise<{ expiresAt: Date }>
    {
        const user = await this.userRepository.findOne({ email: email });
        if (!user) throw new BadRequestException();

        const payload: Payload = {
            sub: user.id,
            school: user.school.campus,
            role: user.role,
            isAdmin: user.hasAdminPrivileges,
            isMod: user.hasModeratorPrivileges,
            type: Token.RESET
        };

        const expiresAtObj = { expiresAt: new Date(Date.now() + (5 * 60 * 1000)) };
        const token = await this.jwtService.signAsync(payload, { expiresIn: "5m" });
        await this.mailService.sendResetEmail(email, token);

        return expiresAtObj;
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>
    {
        const token = resetPasswordDto.token;
        let newPassword = resetPasswordDto.newPassword;

        try
        {
            const payload: Payload = await this.jwtService.verifyAsync(token);
            if (payload.type !== Token.RESET) throw new Error();

            newPassword = await hash(newPassword, 10);
            await this.userRepository.update(payload.sub, { password: newPassword });

            console.log(`${payload.sub} (PASSWORD RESET)`);
        }
        catch
        {
            throw new UnauthorizedException();
        }
    }
}