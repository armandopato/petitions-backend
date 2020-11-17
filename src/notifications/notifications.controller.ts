import { Controller, Delete, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../auth/interfaces/auth-request.interface';
import { User } from '../users/entities/user.entity';
import { PositiveIntPipe } from '../util/positive-int.pipe';
import { Page } from '../util/page/page.interface';
import { UserNotificationInfo } from './interfaces/notification-info.interface';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController
{
    constructor(private readonly notificationsService: NotificationsService)
    {
    }
    
    @UseGuards(JwtAuthGuard)
    @Get()
    async getNotifications(@Request() req: AuthRequest<User>,
                           @Query('page', PositiveIntPipe) page: number): Promise<Page<UserNotificationInfo>>
    {
        return await this.notificationsService.getUserNotifications(req.user, page);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('unread')
    async getNumberOfUnreadNotifications(@Request() req: AuthRequest<User>): Promise<{ unread: number }>
    {
        const unread = await this.notificationsService.getNumberOfUnreadNotifications(req.user);
        return { unread };
    }
    
    @UseGuards(JwtAuthGuard)
    @Delete()
    async deleteNotifications(@Request() req: AuthRequest<User>): Promise<void>
    {
        await this.notificationsService.deleteUserNotifications(req.user);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async markNotificationAsSeenById(@Request() req: AuthRequest<User>,
                                     @Param('id', PositiveIntPipe) notificationId: number): Promise<void>
    {
        await this.notificationsService.markAsSeen(req.user, notificationId);
    }
    
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteNotificationById(@Request() req: AuthRequest<User>,
                                 @Param('id', PositiveIntPipe) notificationId: number): Promise<void>
    {
        await this.notificationsService.deleteUserNotificationById(req.user, notificationId);
    }
}
