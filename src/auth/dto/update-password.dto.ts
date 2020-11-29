import { IsPasswordValid } from 'src/users/validation/is-password-valid.decorator';
import { IsString, Length } from 'class-validator';
import { LengthConstants as LengthConstants } from '../../util/length.enum';


export class UpdatePasswordDto
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
