import { Controller, Post, Put } from '@nestjs/common';

@Controller('auth')
export class AuthController {

    @Post("token")
    getAccessToken(): string
    {
        return "";
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
