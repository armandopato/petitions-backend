import { IsString, Length } from "class-validator";
import { IsPasswordValid } from "src/users/validation/IsPasswordValid";


export class ResetPasswordDto
{
    @IsPasswordValid()
    @Length(8, 15)
    @IsString()
    newPassword: string;

    @IsString()
    token: string;
}