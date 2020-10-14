import { SchoolType } from 'src/users/School';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { IsEmailDomainValid } from '../validation/IsEmailDomainValid';
import { IsPasswordValid } from '../validation/IsPasswordValid';

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