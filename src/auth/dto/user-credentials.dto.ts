import { IsEmailDomainValid } from 'src/users/validation/is-email-domain-valid.decorator';
import { IsEmail, IsString, Length } from 'class-validator';
import { IsPasswordValid } from 'src/users/validation/is-password-valid.decorator';
import { LengthConstants as LengthConstants } from '../../util/length.enum';

export class EmailDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;
}

export class UserCredentialsDto extends EmailDto
{
    @IsPasswordValid()
    @Length(LengthConstants.MIN_PASSWORD, LengthConstants.MAX_PASSWORD)
    @IsString()
    password: string;
}
