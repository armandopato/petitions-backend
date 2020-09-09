import { Controller, Post, Body, Get, Delete, Patch, UseGuards, Put, Query, Param } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from '../auth/guards/isAdmin.guard';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { AuthRequest } from 'src/types/AuthRequest';
import { Request } from '@nestjs/common';
import { MeGuard } from '../auth/guards/me.guard';
import { ChangeUserSettingsDto, UserSettingsAndSchoolDto, ChangeSchoolDto } from './dto/user-settings.dto';
import { PositiveIntPipe } from 'src/util/positive-int.pipe';
import { PetitionInfo, ResolutionInfo } from 'src/types/ElementInfo';
import { UserNotificationInfo } from 'src/types/UserNotificationInfo';
import { Page } from 'src/types/Page';

@Controller('users')
export class UserController
{
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
    async getSavedPetitions(@Request() req: AuthRequest, @Query("page", PositiveIntPipe) page: number): Promise<Page<PetitionInfo>>
    {
        return await this.userService.getSavedPetitions(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get("saved/resolutions")
    async getSavedResolutions(@Request() req: AuthRequest, @Query("page", PositiveIntPipe) page: number): Promise<Page<ResolutionInfo>>
    {
        return await this.userService.getSavedResolutions(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get("notifications")
    async getNotifications(@Request() req: AuthRequest, @Query("page", PositiveIntPipe) page: number): Promise<Page<UserNotificationInfo>>
    {
        return await this.userService.getUserNotifications(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get("notifications/unread")
    async getNumberOfUnreadNotifications(@Request() req: AuthRequest): Promise<{ unread: number }>
    {
        const unread = await this.userService.getNumberOfUnreadNotifications(req.user);
        return { unread };
    }

    @UseGuards(JwtAuthGuard)
    @Delete("notifications")
    async deleteNotifications(@Request() req: AuthRequest): Promise<void>
    {
        await this.userService.deleteUserNotifications(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Delete("notifications/:id")
    async deleteNotificationById(@Request() req: AuthRequest, @Param("id", PositiveIntPipe) notificationId: number): Promise<void>
    {
        await this.userService.deleteUserNotificationById(req.user, notificationId);
    }

    @UseGuards(JwtAuthGuard)
    @Get("settings")
    getUserSettingsAndSchool(@Request() req: AuthRequest): UserSettingsAndSchoolDto
    {
        return this.userService.getUserSettingsAndSchool(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("settings")
    async modifyUserSettings(@Request() req: AuthRequest, @Body() changeUserSettingsDto: ChangeUserSettingsDto): Promise<void>
    {
        await this.userService.modifyUserSettings(req.user, changeUserSettingsDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("school")
    async modifySchool(@Request() req: AuthRequest, @Body() changeSchoolDto: ChangeSchoolDto): Promise<void>
    {
        await this.userService.modifySchool(req.user, changeSchoolDto.newCampus);
    }
}
