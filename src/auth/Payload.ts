import { SchoolType } from '../users/School';
import { Token } from './Token';
import { Role } from '../users/Role';

export class Payload
{
    sub: number; // (id)
    school: SchoolType;
    role: Role;
    isAdmin: boolean;
    isMod: boolean;
    type: Token;
}