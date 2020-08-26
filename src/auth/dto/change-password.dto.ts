import { IsPasswordValid } from "src/users/validation/IsPasswordValid";
import { Length, IsString } from "class-validator";


export class ChangePasswordDto
{
    @IsPasswordValid()
    @Length(8, 15)
    @IsString()
    password: string;

    @IsPasswordValid()
    @Length(8, 15)
    @IsString()
    newPassword: string;
}