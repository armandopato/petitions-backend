import { Controller, Post, Body, Get, Delete, Patch, UseGuards, Put, Query, BadRequestException, Param } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from './guards/isAdmin.guard';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { AuthRequest } from 'src/types/AuthRequest';
import { Request } from '@nestjs/common';
import { MeGuard } from './guards/me.guard';
import { PetitionsCollection, ResolutionsCollection, NotificationsCollection } from 'src/types/ElementsCollection';

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Post()
    async signUp(@Body() createUserDto: CreateUserDto): Promise<void>
    {
        await this.userService.createUser(createUserDto);
    }

    @UseGuards(JwtAuthGuard, MeGuard)
    @Put()
    async modifyUser(@Body() modifyUserDto: ModifyUserDto): Promise<void>
    {
        return await this.userService.updateUserPrivileges(modifyUserDto);
    }

    @UseGuards(JwtAuthGuard, IsAdminGuard)
    @Patch()
    async modifyUserRole(@Body() modifyUserRoleDto: ModifyUserRoleDto, @Request() req: AuthRequest): Promise<void>
    {
        return await this.userService.updateUserRole(modifyUserRoleDto, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Get("saved/petitions")
    async getSavedPetitions(@Request() req: AuthRequest, @Query("page") page: number): Promise<PetitionsCollection>
    {
        if (Number.isNaN(page) || page < 1) throw new BadRequestException();
        return await this.userService.getSavedPetitions(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get("saved/resolutions")
    async getSavedResolutions(@Request() req: AuthRequest, @Query("page") page: number): Promise<ResolutionsCollection>
    {
        if (Number.isNaN(page) || page < 1) throw new BadRequestException();
        return await this.userService.getSavedResolutions(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get("notifications")
    async getNotifications(@Request() req: AuthRequest, @Query("page") page: number): Promise<NotificationsCollection>
    {
        if (Number.isNaN(page) || page < 1) throw new BadRequestException();
        return await this.userService.getUserNotifications(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Delete("notifications")
    async deleteNotifications(@Request() req: AuthRequest): Promise<void>
    {
        await this.userService.deleteUserNotifications(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Delete("notifications/:id")
    async deleteNotificationById(@Request() req: AuthRequest, @Param("id") notificationId: number): Promise<void>
    {
        if (Number.isNaN(notificationId) || notificationId < 1) throw new BadRequestException();
        await this.userService.deleteUserNotificationById(req.user, notificationId);
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
        // user cant change school if is part of support team, neither admin nor moderator
        return;
    }
}
