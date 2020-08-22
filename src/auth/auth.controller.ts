import { Controller, Post, Put, Body } from '@nestjs/common';
import { UserCredentials } from './dto/user-credentials.dto';

@Controller('auth')
export class AuthController {

    @Post("token")
    login(@Body() userCredentials: UserCredentials): string
    {
        console.log(userCredentials);
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
