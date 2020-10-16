import { IsPasswordValid } from 'src/users/validation/IsPasswordValid';
import { IsString, Length } from 'class-validator';
import { Length as LengthConstants } from '../../util/Length';


export class ChangePasswordDto
{
    @IsPasswordValid()
    @Length(LengthConstants.MIN_PASSWORD, LengthConstants.MAX_PASSWORD)
    @IsString()
    password: string;
    
    @IsPasswordValid()
    @Length(LengthConstants.MIN_PASSWORD, LengthConstants.MAX_PASSWORD)
    @IsString()
    newPassword: string;
}