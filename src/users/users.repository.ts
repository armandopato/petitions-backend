import { EntityRepository, Repository, getConnection } from "typeorm";
import { StudentUser, SupportTeamUser, User } from "src/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { School } from "src/entities/school.entity";
import { Settings } from "src/entities/settings.entity";
import { hash } from 'bcrypt';
import { Petition } from "src/entities/petition.entity";
import { Resolution } from "src/entities/resolution.entity";
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