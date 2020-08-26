import { Controller, Post, Put, UseGuards, Request, Body, UnauthorizedException } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { AccessObj } from 'src/types/AccessObj';
import { AuthRequest } from 'src/types/AuthRequest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

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

    @UseGuards(JwtAuthGuard)
    @Put("password")
    async changePassword(@Request() req: AuthRequest, @Body() changePasswordDto: ChangePasswordDto): Promise<{ userId:number }>
    {
        return await this.authService.changePassword(req.user, changePasswordDto);
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
