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

    async getSavedPetitionsPage(userId: number, page: number): Promise<Page<Petition>>
    {
        const query = this.connection.createQueryBuilder(Petition, "petition")
									.innerJoinAndSelect("petition.savedBy", "user")
									.where("user.id = :id", { id: userId });
											  
        return await getPage(query, page);
    }

    async getSavedResolutionsPage(userId: number, page: number): Promise<Page<Resolution>>
    {
		const query = this.connection.createQueryBuilder(Resolution, "resolution")
											.innerJoinAndSelect("resolution.savedBy", "user")
											.where("user.id = :id", { id: userId });
											
        return await getPage(query, page);
    }

    
    async deleteUserNotifications(userId: number): Promise<void>
    {
        const query = this.connection.createQueryBuilder(UserNotification, "notification")
                                    .innerJoinAndSelect("notification.users", "user")
                                    .where("user.id = :userId", { userId: userId });

        const notifications = await query.getCount();
        if (notifications === 0) throw new NotFoundException();

        await query.delete()
                    .from("user_notifications_user_notification")
                    .where("userId = :userId", { userId: userId })
                    .execute()
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
    }


    async getUserNotificationsPage(userId: number, page: number): Promise<Page<UserNotification>>
    {
        const query = this.connection.createQueryBuilder(UserNotification, "notification")
                                                .innerJoinAndSelect("notification.users", "user")
                                                .where("user.id = :id", { id: userId });
        
        return await getPage(query, page);
    }
    // add notification deletion when no notification is associated
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