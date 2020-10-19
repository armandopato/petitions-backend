import { SchoolType } from 'src/users/School';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { IsEmailDomainValid } from '../validation/IsEmailDomainValid';
import { IsPasswordValid } from '../validation/IsPasswordValid';
import { Length as LengthConstants } from '../../util/Length';

export class CreateUserDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;
    
    @IsPasswordValid()
    @Length(LengthConstants.MIN_PASSWORD, LengthConstants.MAX_PASSWORD)
    @IsString()
    password: string;

    @IsEnum(SchoolType)
    school: SchoolType;
}