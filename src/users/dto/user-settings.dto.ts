import { SchoolName } from 'src/users/enums/school-name.enum';
import { IsBoolean, IsEnum } from 'class-validator';

export class UserSettingsAndSchoolDto
{
    newRes: boolean;
    terminated: boolean;
    overdue: boolean;
    school: {
        campus: SchoolName;
        lastChange: Date;
    };
}

export class ChangeUserSettingsDto
{
    @IsBoolean()
    newRes: boolean;
    
    @IsBoolean()
    terminated: boolean;
    
    @IsBoolean()
    overdue: boolean;
}

export class ChangeSchoolDto
{
    @IsEnum(SchoolName)
    newCampus: SchoolName;
}
