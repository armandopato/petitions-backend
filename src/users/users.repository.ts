import { EntityRepository, Repository } from "typeorm";
import { StudentUser, SupportTeamUser, User } from "src/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { School } from "src/entities/school.entity";
import { Settings } from "src/entities/settings.entity";
import { CreateUserRes } from "./dto/create-user-res.dto";


@EntityRepository(StudentUser)
export class StudentUserRepository extends Repository<StudentUser>
{
    async createUser(createUserDto: CreateUserDto): Promise<CreateUserRes>
    {
        // check uniqueness and send confirmation email (pending)
        const { email, password, school } = createUserDto;

        const newSchool = new School();
        newSchool.campus = school;

        const newSettings = new Settings();

        let newUser = new User();
        newUser.email = email;
        newUser.school = newSchool;
        newUser.settings = newSettings;

        // add auth scheme
        newUser.hash = "c";
        newUser.salt = "d";
        newUser = await this.save(newUser);
        console.log(newUser);
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