import { SchoolName } from 'src/users/enums/school-name.enum';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { IsEmailDomainValid } from '../validation/is-email-domain-valid.decorator';
import { IsPasswordValid } from '../validation/is-password-valid.decorator';
import { LengthConstants as LengthConstants } from '../../util/length.enum';

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
    
    @IsEnum(SchoolName)
    school: SchoolName;
}
