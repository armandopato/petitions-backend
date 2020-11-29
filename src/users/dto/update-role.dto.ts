import { IsEmailDomainValid } from '../validation/is-email-domain-valid.decorator';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from '../enums/role.enum';

export class UpdateRoleDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;
    
    @IsEnum(Role)
    role: Role;
}
