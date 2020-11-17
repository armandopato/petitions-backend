import { IsString, Length } from 'class-validator';
import { IsPasswordValid } from 'src/users/validation/is-password-valid.decorator';
import { LengthConstants as LengthConstants } from '../../util/length.enum';


export class ResetPasswordDto
{
    @IsPasswordValid()
    @Length(LengthConstants.MIN_PASSWORD, LengthConstants.MAX_PASSWORD)
    @IsString()
    newPassword: string;
    
    @IsString()
    token: string;
}
