import { Role } from 'src/users/enums/role.enum';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { IsEmailDomainValid } from '../validation/is-email-domain-valid.decorator';

export class UpdatePrivilegesDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;
    
    @IsBoolean()
    admin: boolean;
    
    @IsBoolean()
    moderator: boolean;
    
    @IsBoolean()
    active: boolean;
    
    @IsEnum(Role)
    role: Role;
}
