import { SchoolType } from "src/types/School";
import { IsBoolean, IsEnum } from "class-validator";

export class UserSettingsAndSchoolDto
{
    new: boolean;
    terminated: boolean;
    overdue: boolean;
    school: {
        campus: SchoolType;
        lastChange: Date;
    }
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