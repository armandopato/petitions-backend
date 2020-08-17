import { SchoolType } from "src/types/School";
import { IsString, IsEnum, IsEmail, Length } from "class-validator";
import { IsEmailDomainValid } from "../validation/IsEmailDomainValid";
import { IsPasswordValid } from "../validation/IsPasswordValid";

export class CreateUserDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;

    @IsPasswordValid()
    @Length(8, 15)
    @IsString()
    password: string;

    @IsEnum(SchoolType)
    school: SchoolType;
}