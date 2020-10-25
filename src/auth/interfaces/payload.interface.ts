import { SchoolName } from '../../users/enums/school-name.enum';
import { Token } from '../enums/token.enum';
import { Role } from '../../users/enums/role.enum';

export interface Payload
{
    sub: number; // (id)
    school: SchoolName;
    role: Role;
    isAdmin: boolean;
    isMod: boolean;
    type: Token;
}