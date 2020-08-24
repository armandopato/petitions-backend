import { IsEmailDomainValid } from "src/users/validation/IsEmailDomainValid";
import { IsEmail, IsString, Length } from "class-validator";
import { IsPasswordValid } from "src/users/validation/IsPasswordValid";

export class UserCredentials
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;

    @IsPasswordValid()
    @Length(8, 15)
    @IsString()
    password: string;
}