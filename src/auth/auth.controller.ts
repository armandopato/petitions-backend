import { Controller, Post, Put, UseGuards, Request, Response, Body, UnauthorizedException } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { AuthRequest } from 'src/types/AuthRequest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Response as ExpressResponse, CookieOptions } from 'express';
import { User } from 'src/entities/user.entity';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post()
    async login(@Request() req: AuthRequest, @Response() res: ExpressResponse): Promise<void>
    {
        const {user} = req;
        if (user.confirmationToken)
        {
            throw new UnauthorizedException();
        }

        await this.sendAuthTokens(res, user);
    }

    @Put()
    refreshToken(): string
    {
        return "";
    }

    @Post("password")
    resetPassword(): string
    {
        return "";
    }

    @UseGuards(JwtAuthGuard)
    @Put("password")
    async changePassword(@Request() req: AuthRequest, @Body() changePasswordDto: ChangePasswordDto): Promise<{ userId:number }>
    {
        return await this.authService.changePassword(req.user, changePasswordDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post("email")
    async confirmEmailAndSignIn(@Request() req: AuthRequest, @Response() res: ExpressResponse, @Body("token") confirmationToken: string ): Promise<void>
    {
        const {user} = req;
        if (!user.confirmationToken || !confirmationToken)
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
            expires: new Date(Date.now() + 12096e5)
        };

        res.cookie("refresh_token", refresh_token, cookieOptions);
        res.json({ access_token });
    }
}
