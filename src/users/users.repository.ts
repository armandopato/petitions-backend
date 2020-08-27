import { EntityRepository, Repository } from "typeorm";
import { StudentUser, SupportTeamUser } from "src/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { School } from "src/entities/school.entity";
import { Settings } from "src/entities/settings.entity";
import { CreateUserRes } from "./dto/create-user-res.dto";
import { hash } from 'bcrypt';


@EntityRepository(StudentUser)
export class StudentUserRepository extends Repository<StudentUser>
{
    async createUser(createUserDto: CreateUserDto, token: string): Promise<CreateUserRes>
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
        newUser.confirmationToken = token;

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