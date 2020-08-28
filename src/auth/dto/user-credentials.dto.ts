import { IsEmailDomainValid } from "src/users/validation/IsEmailDomainValid";
import { IsEmail, IsString, Length } from "class-validator";
import { IsPasswordValid } from "src/users/validation/IsPasswordValid";

export class EmailDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;
}

export class UserCredentials extends EmailDto
{
    @IsPasswordValid()
    @Length(8, 15)
    @IsString()
    password: string;
}