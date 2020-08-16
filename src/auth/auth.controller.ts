import { Controller, Post, Put, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {

    @Post()
    signUp(@Body() createUserDto: CreateUserDto): string
    {
        return "hello raza";
    }

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
