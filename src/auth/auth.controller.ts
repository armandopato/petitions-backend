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

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post()
    async login(@Request() req: AuthRequest, @Response() res: ExpressResponse): Promise<void>
    {
        const {user} = req;
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

    @Post("password")
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void>
    {
        await this.authService.resetPassword(resetPasswordDto);
    }

    @Put("password")
    async generatePasswordResetToken(@Body() emailDto: EmailDto): Promise<{ expiresAt: Date }>
    {
        return await this.authService.sendPasswordResetToken(emailDto.email);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("password")
    async changePassword(@Request() req: AuthRequest, @Body() changePasswordDto: ChangePasswordDto): Promise<void>
    {
        await this.authService.changePassword(req.user, changePasswordDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post("email")
    async confirmEmailAndSignIn(@Request() req: AuthRequest, @Response() res: ExpressResponse, @Body("token") confirmationToken: string ): Promise<void>
    {
        const {user} = req;
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
            secure: true,
            sameSite: "strict",
            expires: new Date(Date.now() + 12096e5), // 14 days
            path: '/auth'
        };

        res.cookie("refresh_token", refresh_token, cookieOptions);
        res.json({ access_token });
    }
}
