import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserNotification } from 'src/notifications/notification.entity';
import { UserToNotification } from 'src/users/entities/user-to-notification.entity';
import { User } from 'src/users/entities/user.entity';
import { Page } from 'src/util/page/page.interface';
import { getPageUtil } from 'src/util/page/get-page-util';
import { EntityRepository, getConnection, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { ResolutionStatus } from '../posts/resolutions/enums/resolution-status.enum';

@EntityRepository(UserNotification)
export class NotificationsRepository extends Repository<UserNotification>
{
    private readonly connection = getConnection();
    
    async deleteUserRelations(userId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, 'rel')
            .innerJoinAndSelect('rel.notifications', 'notification')
            .where('rel.user = :id', { id: userId });
        
        const [notificationRels, numNotifications] = await query.getManyAndCount();
        if (numNotifications === 0) throw new NotFoundException();
        
        await query.delete()
            .where('user = :id')
            .execute();
        
        const notificationIds = notificationRels.map(notificationRel => notificationRel.notification.id);
        this.deleteUnnecessary(notificationIds);
    }
    
    
    async deleteUserRelationById(userId: number, notificationId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, 'rel')
            .where('rel.user = :id', { id: userId })
            .andWhere('rel.notifications = :notifId', { notifId: notificationId });
        
        const notification = await query.getCount();
        if (!notification) throw new NotFoundException();
        
        await query.delete().where('notifications = :notifId').execute();
        
        this.deleteUnnecessaryById(notificationId);
    }
    
    async getUserRelationsPage(userId: number, page: number): Promise<Page<UserToNotification>>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, 'rel')
            .innerJoinAndSelect('rel.notifications', 'notification')
            .innerJoinAndSelect('notifications.resolution', 'res')
            .where('rel.user = :id', { id: userId })
            .orderBy('rel.id', 'DESC');
        
        return await getPageUtil(query, page);
    }
    
    async getUnreadNumber(userId: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(UserToNotification, 'notification')
            .addSelect('notifications.userId', 'userid')
            .where('userid = :id', { id: userId })
            .where('notifications.seen = false')
            .getCount();
    }
    
    async markAsSeenById(userId: number, notificationId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, 'rel')
            .where('rel.user = :id', { id: userId })
            .andWhere('rel.notifications = :notifId', { notifId: notificationId });
        
        const notificationRelation = await query.getOne();
        if (!notificationRelation) throw new NotFoundException();
        if (notificationRelation.seen) throw new ConflictException();
        
        await query.update({ seen: true })
            .where('user = :id')
            .andWhere('notifications = :notifId')
            .execute();
    }
    
    async createRelations(notification: UserNotification): Promise<void>
    {
        const campus = notification.resolution.petition.campus;
        const query = this.connection.createQueryBuilder(User, 'user')
            .innerJoin('user.settings', 'settings')
            .innerJoin('user.school', 'school')
            .where('school.campus = :campus', { campus: campus });
        
        switch (notification.type)
        {
            case ResolutionStatus.IN_PROGRESS:
                query.andWhere('settings.notifyNewResolutions = true');
                break;
            
            case ResolutionStatus.OVERDUE:
                query.andWhere('settings.notifyOverdueResolutions = true');
                break;
            
            case ResolutionStatus.TERMINATED:
                query.andWhere('settings.notifyTerminatedResolutions = true');
                break;
        }
        
        const users = await query.getMany();
        const notificationRelations: QueryDeepPartialEntity<UserToNotification>[] = users.map(user => {
            return {
                notification: notification,
                user: user,
            };
        });
        
        await this.connection.createQueryBuilder(UserToNotification, 'rel')
            .insert().values(notificationRelations).execute();
    }
    
    private async deleteUnnecessary(notificationIds: number[]): Promise<void>
    {
        for (const id of notificationIds)
        {
            await this.deleteUnnecessaryById(id);
        }
    }
    
    private async deleteUnnecessaryById(notificationId: number): Promise<void>
    {
        const queryBuilder = this.connection.createQueryBuilder(UserNotification, 'notification');
        
        const numOfAssociatedUsers = await queryBuilder.innerJoin('notifications.userToNotifications', 'relation')
            .where('notifications.id = :id', { id: notificationId })
            .getCount();
        
        if (numOfAssociatedUsers === 0)
        {
            await queryBuilder.delete()
                .where('id = :notificationId', { notificationId: notificationId })
                .execute();
        }
    }
}
