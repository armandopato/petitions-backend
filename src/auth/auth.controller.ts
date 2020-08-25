import { Controller, Post, Put, UseGuards, Request, Body, UnauthorizedException } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { AccessObj } from 'src/types/AccessObj';
import { AuthRequest } from 'src/types/AuthRequest';


@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post()
    login(@Request() req: AuthRequest): AccessObj
    {
        const {user} = req;
        if (user.confirmationToken)
        {
            throw new UnauthorizedException();
        }
        return this.authService.generateJWT(user);
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

    @Put("password")
    changePassword(): string
    {
        return "";
    }

    @UseGuards(LocalAuthGuard)
    @Post("email")
    async confirmEmail(@Request() req: AuthRequest, @Body("token") confirmationToken: string ): Promise<AccessObj>
    {
        const {user} = req;
        if (!user.confirmationToken)
        {
            throw new UnauthorizedException();
        }
        return await this.authService.confirmEmail(req.user, confirmationToken);
    }
}
