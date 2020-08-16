import { SchoolType } from "src/types/School";
import { IsString, IsEnum, IsEmail, Length } from "class-validator";
import { IsEmailDomainValid } from "../validation/IsEmailDomainValid";

export class CreateUserDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;

    @Length(10, 200)
    @IsString({ })
    password: string;

    @IsEnum(SchoolType)
    school: SchoolType;
}