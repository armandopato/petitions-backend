import { IsString, Length } from 'class-validator';
import { IsPasswordValid } from 'src/users/validation/IsPasswordValid';
import { Length as LengthConstants } from '../../util/Length';


export class ResetPasswordDto
{
    @IsPasswordValid()
    @Length(LengthConstants.MIN_PASSWORD, LengthConstants.MAX_PASSWORD)
    @IsString()
    newPassword: string;
    
    @IsString()
    token: string;
}