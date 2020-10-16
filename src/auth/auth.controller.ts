import {
    Body,
    Controller,
    Patch,
    Post,
    Put,
    Request,
    Response,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { AuthRequest } from 'src/auth/AuthRequest.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CookieOptions, Response as ExpressResponse } from 'express';
import { User } from 'src/users/entities/user.entity';
import { RefreshGuard } from './guards/refresh.guard';
import { EmailDto } from './dto/user-credentials.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { getDaysMilliseconds } from '../util/getDaysMilliseconds';

@Controller('auth')
export class AuthController
{
    private readonly SECURE: boolean;
    private readonly SAME_SITE: boolean | 'lax' | 'strict' | 'none';
    private readonly REFRESH_EXPIRATION_MILLISECONDS: number;
    
    constructor(private authService: AuthService,
                private configService: ConfigService)
    {
        this.SECURE = this.configService.get<string>('SECURE') === 'true';
        this.SAME_SITE = this.configService.get('SAME_SITE');
        this.REFRESH_EXPIRATION_MILLISECONDS = getDaysMilliseconds(this.configService.get<string>('REFRESH_EXPIRATION'));
    }
    
    @UseGuards(LocalAuthGuard)
    @Post()
    async login(@Request() req: AuthRequest, @Response() res: ExpressResponse): Promise<void>
    {
        const { user } = req;
        if (!user.active)
        {
            throw new UnauthorizedException();
        }
        await this.sendAuthTokens(res, user);
    }
    
    @UseGuards(RefreshGuard)
    @Put()
    async refreshToken(@Request() req: AuthRequest, @Response() res: ExpressResponse): Promise<void>
    {
        await this.sendAuthTokens(res, req.user);
    }
    
    @Post('password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void>
    {
        await this.authService.resetPassword(resetPasswordDto);
    }
    
    @Put('password')
    async generatePasswordResetToken(@Body() emailDto: EmailDto): Promise<{ expiresAt: Date }>
    {
        return await this.authService.sendPasswordResetToken(emailDto.email);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch('password')
    async changePassword(@Request() req: AuthRequest, @Body() changePasswordDto: ChangePasswordDto): Promise<void>
    {
        await this.authService.changePassword(req.user, changePasswordDto);
    }
    
    @UseGuards(LocalAuthGuard)
    @Post('email')
    async confirmEmailAndSignIn(@Request() req: AuthRequest, @Response() res: ExpressResponse, @Body('token') confirmationToken: string): Promise<void>
    {
        const { user } = req;
        if (user.active)
        {
            throw new UnauthorizedException();
        }
        await this.authService.confirmEmail(user, confirmationToken);
        await this.sendAuthTokens(res, user);
    }
    
    async sendAuthTokens(res: ExpressResponse, user: User): Promise<void>
    {
        const { access_token, refresh_token } = await this.authService.generateAuthTokens(user);
        
        const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: this.SECURE,
            sameSite: this.SAME_SITE,
            expires: new Date(Date.now() + this.REFRESH_EXPIRATION_MILLISECONDS),
            path: '/auth',
        };
        
        res.cookie('refresh_token', refresh_token, cookieOptions);
        res.json({ access_token });
    }
}
