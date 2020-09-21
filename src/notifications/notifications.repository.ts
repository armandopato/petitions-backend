import { ConflictException, NotFoundException } from "@nestjs/common";
import { UserNotification } from "src/entities/notification.entity";
import { UserToNotification } from "src/entities/user-to-notification.entity";
import { User } from "src/entities/user.entity";
import { ResolutionStatus } from "src/types/ElementStatus";
import { Page } from "src/types/Page";
import { getPage } from "src/util/getPage";
import { EntityRepository, getConnection, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

@EntityRepository(UserNotification)
export class NotificationsRepository extends Repository<UserNotification>
{
    private connection = getConnection();

    async deleteUserNotifications(userId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, "rel")
                                                .innerJoinAndSelect("rel.notification", "notification")
                                                .where("rel.user = :id", { id: userId });

        const [notificationRels, numNotifications] = await query.getManyAndCount();
        if (numNotifications === 0) throw new NotFoundException();

        await query.delete()
                    .where("user = :id")
                    .execute();
        
        const notificationIds = notificationRels.map(notificationRel => notificationRel.notification.id);
        this.cleanNotifications(notificationIds);
    }


    async deleteUserNotificationById(userId: number, notificationId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, "rel")
                                                .where("rel.user = :id", { id: userId })
                                                .andWhere("rel.notification = :notifId", { notifId: notificationId });
                        
        const notification = await query.getCount();
        if (!notification) throw new NotFoundException();

        await query.delete().where("notification = :notifId").execute();
        
        this.cleanNotification(notificationId);
    }

    async getUserNotificationRelationPage(userId: number, page: number): Promise<Page<UserToNotification>>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, "rel")
                                                .innerJoinAndSelect("rel.notification", "notification")
                                                .innerJoinAndSelect("notification.resolution", "res")
                                                .where("rel.user = :id", { id: userId })
                                                .orderBy("rel.id", "DESC");
        
        return await getPage(query, page);
    }

    async getNumberOfUnreadNotifications(userId: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(UserToNotification, "notification")
                        .addSelect("notification.userId", "userid")
                        .where("userid = :id", { id: userId })
                        .where("notification.seen = false")
                        .getCount();
    }

    private async cleanNotifications(notificationIds: number[]): Promise<void>
    {
        for (const id of notificationIds)
        {
            await this.cleanNotification(id);
        }
    }

    private async cleanNotification(notificationId: number): Promise<void>
    {
        const queryBuilder = this.connection.createQueryBuilder(UserNotification, "notification");

        const numOfAssociatedUsers = await queryBuilder.innerJoin("notification.userToNotifications", "relation")
                                    .where("notification.id = :id", { id: notificationId })
                                    .getCount();
        
        if (numOfAssociatedUsers === 0)
        {
            await queryBuilder.delete()
                                .where("id = :notificationId", { notificationId: notificationId })
                                .execute();
        }
    }

    async createNotificationRelations(notification: UserNotification): Promise<void>
    {
        const campus = notification.resolution.petition.campus;
        const query = this.connection.createQueryBuilder(User, "user")
                                                .innerJoin("user.settings", "settings")
                                                .innerJoin("user.school", "school")
                                                .where("school.campus = :campus", { campus: campus });
        
        switch (notification.type)
        {
            case ResolutionStatus.IN_PROGRESS:
                query.andWhere("settings.notifyNewResolutions = true");
                break;
            
            case ResolutionStatus.OVERDUE:
                query.andWhere("settings.notifyOverdueResolutions = true");
                break;
            
            case ResolutionStatus.TERMINATED:
                query.andWhere("settings.notifyTerminatedResolutions = true")
                break;
        }

        const users = await query.getMany();
        const notificationRelations: QueryDeepPartialEntity<UserToNotification>[] = users.map(user => {
            return {
                notification: notification,
                user: user
            }
        });

        await this.connection.createQueryBuilder(UserToNotification, "rel")
                            .insert().values(notificationRelations).execute();
    }

    async markAsSeen(userId: number, notificationId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserToNotification, "rel")
                                                .where("rel.user = :id", { id: userId })
                                                .andWhere("rel.notification = :notifId", { notifId: notificationId });
                        
        const notificationRelation = await query.getOne();
        if (!notificationRelation) throw new NotFoundException();
        if (notificationRelation.seen) throw new ConflictException();

        await query.update({ seen: true })
                    .where("user = :id")
                    .andWhere("notification = :notifId")
                    .execute();
    }
}