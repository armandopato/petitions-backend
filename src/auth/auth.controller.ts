import { Controller, Post, Put, UseGuards, Request } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { User } from 'src/entities/user.entity';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post("token")
    login(@Request() req: { user: User }): { access_token: string }
    {
        return this.authService.generateJWT(req.user);
    }

    @Put("token")
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

    @Post("email")
    confirmEmail(): string
    {
        return "";
    }
}
