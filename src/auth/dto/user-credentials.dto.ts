import { IsEmailDomainValid } from 'src/users/validation/IsEmailDomainValid';
import { IsEmail, IsString, Length } from 'class-validator';
import { IsPasswordValid } from 'src/users/validation/IsPasswordValid';
import { Length as LengthConstants } from '../../util/Length';

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
    @Length(LengthConstants.MIN_PASSWORD, LengthConstants.MAX_PASSWORD)
    @IsString()
    password: string;
}