import { EntityRepository, Repository, getConnection } from "typeorm";
import { StudentUser, SupportTeamUser, User } from "src/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { School } from "src/entities/school.entity";
import { Settings } from "src/entities/settings.entity";
import { hash } from 'bcrypt';
import { NotFoundException } from "@nestjs/common";
import { Petition } from "src/entities/petition.entity";
import { Resolution } from "src/entities/resolution.entity";
import { UserNotification } from "src/entities/notification.entity";
import { getPage } from "src/util/getPage";
import { Page } from "src/types/Page";


@EntityRepository(User)
export class UserRepository extends Repository<User>
{
    connection = getConnection();
    // pending: add id to relation to sort according to saving date
    async getSavedPetitionsPage(userId: number, page: number): Promise<Page<Petition>>
    {
        const query = this.connection.createQueryBuilder(Petition, "petition")
									.innerJoinAndSelect("petition.savedBy", "user")
                                    .where("user.id = :id", { id: userId })
                                    .orderBy("petition.id", "DESC");
											  
        return await getPage(query, page);
    }

    async getSavedResolutionsPage(userId: number, page: number): Promise<Page<Resolution>>
    {
		const query = this.connection.createQueryBuilder(Resolution, "resolution")
											.innerJoinAndSelect("resolution.savedBy", "user")
                                            .where("user.id = :id", { id: userId })
                                            .orderBy("resolution.id", "DESC");
											
        return await getPage(query, page);
    }

    
    async deleteUserNotifications(userId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserNotification, "notification")
                                    .innerJoinAndSelect("notification.users", "user")
                                    .where("user.id = :userId", { userId: userId });

        const [notifications, numNotifications] = await query.getManyAndCount();
        if (numNotifications === 0) throw new NotFoundException();

        await query.delete()
                    .from("user_notifications_user_notification")
                    .where("userId = :userId", { userId: userId })
                    .execute()
        
        const notificationIds = notifications.map(not => not.id);
        this.cleanNotifications(notificationIds);
    }


    async deleteUserNotificationById(userId: number, notificationId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserNotification, "notification")
                                    .innerJoinAndSelect("notification.users", "user")
                                    .where("user.id = :userId", { userId: userId })
                                    .andWhere("notification.id = :id", { id: notificationId });
                        
        const notification = await query.getCount();
        if (!notification) throw new NotFoundException();

        await query.relation(UserNotification, "users")
                    .of(notificationId)
                    .remove(userId);
        
        this.cleanNotification(notificationId);
    }


    async getUserNotificationsPage(userId: number, page: number): Promise<Page<UserNotification>>
    {
        const query = this.connection.createQueryBuilder(UserNotification, "notification")
                                                .innerJoinAndSelect("notification.users", "user")
                                                .where("user.id = :id", { id: userId });
        
        return await getPage(query, page);
    }

    async getNumberOfUnreadNotifications(userId: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(UserNotification, "notification")
                        .innerJoinAndSelect("notification.users", "user")
                        .where("user.id = :id", { id: userId })
                        .andWhere("notification.seen = :seen", { seen: false })
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

        const numOfAssociatedUsers = await queryBuilder.innerJoinAndSelect("notification.users", "user")
                                    .where("notification.id = :id", { id: notificationId })
                                    .getCount();
        
        if (numOfAssociatedUsers === 0)
        {
            await queryBuilder.delete()
                                .from(UserNotification, "notification")
                                .where("notification.id = :notificationId", { notificationId: notificationId })
                                .execute();
        }
    }
}

@EntityRepository(StudentUser)
export class StudentUserRepository extends Repository<StudentUser>
{
    async createUser(createUserDto: CreateUserDto): Promise<number>
    {
        const { email, password, school } = createUserDto;

        const newSchool = new School();
        newSchool.campus = school;

        const newSettings = new Settings();

        let newUser = new StudentUser();
        newUser.email = email;
        newUser.school = newSchool;
        newUser.settings = newSettings;
        newUser.password = await hash(password, 10);

        newUser = await this.save(newUser);
        console.log(`${newUser.email} (NEW USER)`);

        return newUser.id;
    }
}



@EntityRepository(SupportTeamUser)
export class SupportTeamUserRepository extends Repository<SupportTeamUser>
{
    
}