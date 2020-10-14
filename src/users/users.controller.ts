import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from '../auth/guards/isAdmin.guard';
import { ModifyUserDto, ModifyUserRoleDto } from './dto/modify-user.dto';
import { AuthRequest } from 'src/auth/AuthRequest.interface';
import { MeGuard } from '../auth/guards/me.guard';
import { ChangeSchoolDto, ChangeUserSettingsDto, UserSettingsAndSchoolDto } from './dto/user-settings.dto';
import { PositiveIntPipe } from 'src/util/positive-int.pipe';
import { PetitionInfo, ResolutionInfo } from 'src/posts/ElementInfo';
import { UserNotificationInfo } from 'src/notifications/UserNotificationInfo';
import { Page } from 'src/util/Page';
import { NotificationsService } from 'src/notifications/notifications.service';

@Controller('users')
export class UsersController
{
    constructor(private usersService: UsersService,
                private notificationsService: NotificationsService)
    {
    }
    
    @Post()
    async signUp(@Body() createUserDto: CreateUserDto): Promise<void>
    {
        await this.usersService.createUser(createUserDto);
    }
    
    @UseGuards(JwtAuthGuard, MeGuard)
    @Put()
    async modifyUser(@Body() modifyUserDto: ModifyUserDto): Promise<void>
    {
        return await this.usersService.updateUserPrivileges(modifyUserDto);
    }

    @UseGuards(JwtAuthGuard, IsAdminGuard)
    @Patch()
    async modifyUserRole(@Body() modifyUserRoleDto: ModifyUserRoleDto, @Request() req: AuthRequest): Promise<void>
    {
        return await this.usersService.updateUserRole(modifyUserRoleDto, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Get("saved/petitions")
    async getSavedPetitions(@Request() req: AuthRequest, @Query("page", PositiveIntPipe) page: number): Promise<Page<PetitionInfo>>
    {
        return await this.usersService.getSavedPetitions(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get("saved/resolutions")
    async getSavedResolutions(@Request() req: AuthRequest, @Query("page", PositiveIntPipe) page: number): Promise<Page<ResolutionInfo>>
    {
        return await this.usersService.getSavedResolutions(req.user, page);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('notification')
    async getNotifications(@Request() req: AuthRequest, @Query("page", PositiveIntPipe) page: number): Promise<Page<UserNotificationInfo>>
    {
        return await this.notificationsService.getUserNotifications(req.user, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get("notifications/unread")
    async getNumberOfUnreadNotifications(@Request() req: AuthRequest): Promise<{ unread: number }>
    {
        const unread = await this.notificationsService.getNumberOfUnreadNotifications(req.user);
        return { unread };
    }
    
    @UseGuards(JwtAuthGuard)
    @Delete('notification')
    async deleteNotifications(@Request() req: AuthRequest): Promise<void>
    {
        await this.notificationsService.deleteUserNotifications(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("notifications/:id")
    async markNotificationAsSeenById(@Request() req: AuthRequest, @Param("id", PositiveIntPipe) notificationId: number): Promise<void>
    {
        await this.notificationsService.markAsSeen(req.user, notificationId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete("notifications/:id")
    async deleteNotificationById(@Request() req: AuthRequest, @Param("id", PositiveIntPipe) notificationId: number): Promise<void>
    {
        await this.notificationsService.deleteUserNotificationById(req.user, notificationId);
    }

    @UseGuards(JwtAuthGuard)
    @Get("settings")
    getUserSettingsAndSchool(@Request() req: AuthRequest): UserSettingsAndSchoolDto
    {
        return this.usersService.getUserSettingsAndSchool(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("settings")
    async modifyUserSettings(@Request() req: AuthRequest, @Body() changeUserSettingsDto: ChangeUserSettingsDto): Promise<void>
    {
        await this.usersService.modifyUserSettings(req.user, changeUserSettingsDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("school")
    async modifySchool(@Request() req: AuthRequest, @Body() changeSchoolDto: ChangeSchoolDto): Promise<void>
    {
        await this.usersService.modifySchool(req.user, changeSchoolDto.newCampus);
    }
}
