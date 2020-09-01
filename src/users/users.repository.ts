import { EntityRepository, Repository, getConnection } from "typeorm";
import { StudentUser, SupportTeamUser, User } from "src/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { School } from "src/entities/school.entity";
import { Settings } from "src/entities/settings.entity";
import { CreateUserRes } from "./dto/create-user-res.dto";
import { hash } from 'bcrypt';
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Petition } from "src/entities/petition.entity";
import { Resolution } from "src/entities/resolution.entity";
import { UserNotification } from "src/entities/notification.entity";


@EntityRepository(User)
export class UserRepository extends Repository<User>
{
    async getSavedPetitionsPage(userId: number, page: number): Promise<{petitions: Petition[], totalPages: number}>
    {
        const query = getConnection().createQueryBuilder(Petition, "petition")
									.innerJoinAndSelect("petition.savedBy", "user")
									.where("user.id = :id", { id: userId });
											
		let totalPages = await query.getCount();
		totalPages = Math.ceil(totalPages / 12);

		if (page > totalPages) throw new BadRequestException();

        const savedPetitions = await query.skip( (page-1) * 12)
										.take(12)
										.getMany();
		
        return { totalPages, petitions: savedPetitions };
    }

    async getSavedResolutionsPage(userId: number, page: number): Promise<{resolutions: Resolution[], totalPages: number}>
    {
		const query = getConnection().createQueryBuilder(Resolution, "resolution")
											.innerJoinAndSelect("resolution.savedBy", "user")
											.where("user.id = :id", { id: userId });
											
		let totalPages = await query.getCount();
		totalPages = Math.ceil(totalPages / 12);

		if (page > totalPages) throw new BadRequestException();

        const savedResolutions = await query.skip( (page-1) * 12)
										.take(12)
                                        .getMany();
		
        return { totalPages, resolutions: savedResolutions };
    }

// one instance of getconnection and ensure parameters in query builder arent repeated, delete unnecessary response data, unnecessary relations in joins, refactor queries
    async deleteUserNotifications(userId: number): Promise<void>
    {
        const query = getConnection().createQueryBuilder(UserNotification, "notification")
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
        const query = getConnection().createQueryBuilder(UserNotification, "notification")
                                    .innerJoinAndSelect("notification.users", "user")
                                    .where("user.id = :userId", { userId: userId })
                                    .andWhere("notification.id = :id", { id: notificationId });
                        
        const notification = await query.getCount();
        if (!notification) throw new NotFoundException();

        await query.relation(UserNotification, "users")
                    .of(notificationId)
                    .remove(userId);
    }
}

@EntityRepository(StudentUser)
export class StudentUserRepository extends Repository<StudentUser>
{
    async createUser(createUserDto: CreateUserDto): Promise<CreateUserRes>
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

        return {
            id: newUser.id,
            email: newUser.email,
            school: newUser.school.campus
        };
    }
}



@EntityRepository(SupportTeamUser)
export class SupportTeamUserRepository extends Repository<SupportTeamUser>
{
    
}