import { Injectable } from '@nestjs/common';
import { UserNotification } from 'src/entities/notification.entity';
import { Resolution } from 'src/entities/resolution.entity';
import { User } from 'src/entities/user.entity';
import { ResolutionRepository } from 'src/resolutions/resolutions.repository';
import { Page } from 'src/types/Page';
import { UserNotificationInfo } from 'src/types/UserNotificationInfo';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService
{
    constructor(private notificationsRepository: NotificationsRepository,
                private resolutionsRepository: ResolutionRepository) {}

    async getUserNotifications(user: User, page: number): Promise<Page<UserNotificationInfo>>
    {
        const { totalPages, pageElements: notificationRelations } = await this.notificationsRepository.getUserNotificationRelationPage(user.id, page);
        const notificationsInfo: UserNotificationInfo[] = [];

        for (const notificationRel of notificationRelations)
        {
            const { id, title } = await this.resolutionsRepository.getIdAndTitleByNotificationId(notificationRel.notification.id);

            notificationsInfo.push({
                id: notificationRel.notification.id,
                seen: notificationRel.seen,
                type: notificationRel.notification.type,
                resolutionId: id,
                resoutionTitle: title
            });
        }

        return {
            totalPages: totalPages,
            pageElements: notificationsInfo
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
