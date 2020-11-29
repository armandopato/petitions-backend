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

export class UpdateSettingsDto
{
    @IsBoolean()
    newRes: boolean;
    
    @IsBoolean()
    terminated: boolean;
    
    @IsBoolean()
    overdue: boolean;
}

export class UpdateSchoolDto
{
    @IsEnum(SchoolName)
    newCampus: SchoolName;
}
