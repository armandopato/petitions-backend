import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { compare, hash } from 'bcrypt';
import { UserCredentials } from './dto/user-credentials.dto';
import { validateOrReject } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { AuthTokens } from 'src/auth/interfaces/auth-tokens.interface';
import { Payload } from 'src/auth/interfaces/payload.interface';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Token } from 'src/auth/enums/token.enum';
import { MailService } from './mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersRepository } from 'src/users/users.repository';
import { ConfigService } from '@nestjs/config';
import { SALT_ROUNDS } from '../util/constants';
import { getMinutesMilliseconds } from '../util/jwt-time-to-ms';

@Injectable()
export class AuthService
{
    private readonly ACCESS_EXPIRATION: string;
    private readonly REFRESH_EXPIRATION: string;
    private readonly RESET_EXPIRATION: string;
    private readonly RESET_EXPIRATION_MILLISECONDS: number;
    
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    )
    {
        this.ACCESS_EXPIRATION = this.configService.get<string>('ACCESS_EXPIRATION');
        this.REFRESH_EXPIRATION = this.configService.get<string>('REFRESH_EXPIRATION');
        this.RESET_EXPIRATION = this.configService.get<string>('RESET_EXPIRATION');
        this.RESET_EXPIRATION_MILLISECONDS = getMinutesMilliseconds(this.RESET_EXPIRATION);
    }
    
    async validateUser(email: string, password: string): Promise<User>
    {
        const userCredentials = new UserCredentials();
        userCredentials.email = email;
        userCredentials.password = password;
    
        try
        {
            await validateOrReject(userCredentials);
        }
        catch (err)
        {
            throw new UnauthorizedException();
        }
    
        const user = await this.usersRepository.findOne({ email: email });
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
            type: Token.ACCESS,
        };
        const refreshPayload: Payload = { ...accessPayload, type: Token.REFRESH };
    
        const access_token = await this.jwtService.signAsync(accessPayload, { expiresIn: this.ACCESS_EXPIRATION });
        const refresh_token = await this.jwtService.signAsync(refreshPayload, { expiresIn: this.REFRESH_EXPIRATION });
    
        return {
            access_token,
            refresh_token,
        };
    }
    
    async confirmEmail(user: User, confirmationToken: string): Promise<void>
    {
        try
        {
            const { sub, type }: Payload = await this.jwtService.verifyAsync(confirmationToken);
            if (type !== Token.CONFIRMATION) throw new Error();
            await this.usersRepository.update(sub, { active: true });
        }
        catch (err)
        {
            throw new UnauthorizedException();
        }
    }
    
    async updatePassword(user: User, changePasswordDto: UpdatePasswordDto): Promise<void>
    {
        const password = changePasswordDto.password;
        let newPassword = changePasswordDto.newPassword;
        
        const match = await compare(password, user.password);
        if (!match) throw new UnauthorizedException();
        
        newPassword = await hash(newPassword, SALT_ROUNDS);
        await this.usersRepository.update(user.id, { password: newPassword });
    }
    
    async sendPasswordResetToken(email: string): Promise<{ expiresAt: Date }>
    {
        const user = await this.usersRepository.findOne({ email: email });
        if (!user) throw new BadRequestException();
    
        const payload: Payload = {
            sub: user.id,
            school: user.school.campus,
            role: user.role,
            isAdmin: user.hasAdminPrivileges,
            isMod: user.hasModeratorPrivileges,
            type: Token.RESET,
        };
    
        const expiresAtObj = { expiresAt: new Date(Date.now() + this.RESET_EXPIRATION_MILLISECONDS) };
        const token = await this.jwtService.signAsync(payload, { expiresIn: this.RESET_EXPIRATION });
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
    
            newPassword = await hash(newPassword, SALT_ROUNDS);
            await this.usersRepository.update(payload.sub, { password: newPassword });
        }
        catch
        {
            throw new UnauthorizedException();
        }
    }
}
