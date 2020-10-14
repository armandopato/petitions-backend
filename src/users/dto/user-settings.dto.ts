import { SchoolType } from 'src/users/School';
import { IsBoolean, IsEnum } from 'class-validator';

export class UserSettingsAndSchoolDto
{
    newRes: boolean;
    terminated: boolean;
    overdue: boolean;
    school: {
        campus: SchoolType;
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
    @IsEnum(SchoolType)
    newCampus: SchoolType;
}