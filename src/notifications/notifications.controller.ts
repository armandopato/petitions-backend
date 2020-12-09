import { Controller, Delete, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../auth/interfaces/auth-request.interface';
import { User } from '../users/entities/user.entity';
import { PositiveIntPipe } from '../util/positive-int.pipe';
import { Page } from '../util/page/page.interface';
import { UserNotificationInfo } from './interfaces/notification-info.interface';
import { NotificationsService } from './notifications.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController
{
    constructor(private readonly notificationsService: NotificationsService)
    {
    }
    
    @UseGuards(JwtAuthGuard)
    @Get()
    async getPageInfo(@Request() req: AuthRequest<User>,
                      @Query('page', PositiveIntPipe) page: number): Promise<Page<UserNotificationInfo>>
    {
        return await this.notificationsService.getInfoPage(req.user, page);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('unread')
    async getUnreadNumber(@Request() req: AuthRequest<User>): Promise<{ unread: number }>
    {
        const unread = await this.notificationsService.getUnreadNumber(req.user);
        return { unread };
    }
    
    @UseGuards(JwtAuthGuard)
    @Delete()
    async deleteAll(@Request() req: AuthRequest<User>): Promise<void>
    {
        await this.notificationsService.deleteAll(req.user);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async markAsSeenById(@Request() req: AuthRequest<User>,
                         @Param('id', PositiveIntPipe) notificationId: number): Promise<void>
    {
        await this.notificationsService.markAsSeenById(req.user, notificationId);
    }
    
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteById(@Request() req: AuthRequest<User>,
                     @Param('id', PositiveIntPipe) notificationId: number): Promise<void>
    {
        await this.notificationsService.deleteById(req.user, notificationId);
    }
}
