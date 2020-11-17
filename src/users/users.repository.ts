import { EntityRepository, Repository } from 'typeorm';
import { StudentUser, User } from 'src/users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { School } from 'src/users/entities/school.entity';
import { Settings } from 'src/users/entities/settings.entity';
import { hash } from 'bcrypt';
import { SALT_ROUNDS } from '../util/constants';


@EntityRepository(User)
export class UsersRepository extends Repository<User>
{
}

@EntityRepository(StudentUser)
export class StudentUsersRepository extends Repository<StudentUser>
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
        newUser.password = await hash(password, SALT_ROUNDS);
        
        newUser = await this.save(newUser);
        
        return newUser.id;
    }
}


/*
@EntityRepository(SupportTeamUser)
export class SupportTeamUsersRepository extends Repository<SupportTeamUser>
{

}*/
