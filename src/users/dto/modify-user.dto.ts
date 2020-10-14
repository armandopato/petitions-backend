import { Role } from 'src/users/Role';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { IsEmailDomainValid } from '../validation/IsEmailDomainValid';

export class ModifyUserDto
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

export class ModifyUserRoleDto
{
    @IsEmailDomainValid()
    @IsEmail()
    @IsString()
    email: string;

    @IsEnum(Role)
    role: Role;
}