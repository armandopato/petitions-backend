import { Controller, Post, Body, Get, Delete, Patch, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserService } from './users.service';
import { CreateUserRes } from './dto/create-user-res.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Post()
    async signUp(@Body() createUserDto: CreateUserDto): Promise<CreateUserRes>
    {
        return await this.userService.createUser(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch()
    async modifyUserPrivileges(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard)
    @Get("saved")
    async getSavedElements(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard)
    @Get("notifications")
    async getNotifications(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard)
    @Delete("notifications")
    async deleteNotifications(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard)
    @Delete("notifications/:id")
    async deleteNotificationById(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard)
    @Get("settings")
    async getUserSettings(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard)
    @Patch("settings")
    async modifySettings(): Promise<void>
    {
        return;
    }
}
