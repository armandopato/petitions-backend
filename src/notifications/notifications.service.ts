import { Injectable } from '@nestjs/common';
import { UserNotification } from 'src/notifications/notification.entity';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { User } from 'src/users/entities/user.entity';
import { ResolutionsRepository } from 'src/posts/resolutions/resolutions.repository';
import { Page } from 'src/util/page/page.interface';
import { UserNotificationInfo } from 'src/notifications/interfaces/notification-info.interface';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService
{
    constructor(private readonly notificationsRepository: NotificationsRepository,
                private readonly resolutionsRepository: ResolutionsRepository)
    {
    }
    
    async getUserNotifications(user: User, page: number): Promise<Page<UserNotificationInfo>>
    {
        const { totalPages, pageElements: notificationRelations } = await this.notificationsRepository.getUserNotificationRelationPage(
            user.id, page);
        const notificationsInfo: UserNotificationInfo[] = [];
    
        for (const notificationRel of notificationRelations)
        {
            const { id, title } = await this.resolutionsRepository.getIdAndTitleByNotificationId(
                notificationRel.notification.id);
        
            notificationsInfo.push({
                id: notificationRel.notification.id,
                seen: notificationRel.seen,
                type: notificationRel.notification.type,
                resolutionId: id,
                resolutionTitle: title,
            });
        }
    
        return {
            totalPages: totalPages,
            pageElements: notificationsInfo,
        };
    }
    
    async getNumberOfUnreadNotifications(user: User): Promise<number>
    {
        return await this.notificationsRepository.getNumberOfUnreadNotifications(user.id);
    }
    
    async deleteUserNotifications(user: User): Promise<void>
    {
        await this.notificationsRepository.deleteUserNotifications(user.id);
    }
    
    async deleteUserNotificationById(user: User, notificationId: number): Promise<void>
    {
        await this.notificationsRepository.deleteUserNotificationById(user.id, notificationId);
    }
    
    async markAsSeen(user: User, notificationId: number): Promise<void>
    {
        await this.notificationsRepository.markAsSeen(user.id, notificationId);
    }
    
    async triggerNotifications(resolution: Resolution): Promise<void>
    {
        const newNotification = new UserNotification();
        newNotification.resolution = resolution;
        newNotification.type = this.resolutionsRepository.getResolutionStatus(resolution);
        await this.notificationsRepository.save(newNotification);
        await this.notificationsRepository.createNotificationRelations(newNotification);
    }
}
