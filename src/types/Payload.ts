import { SchoolType } from "./School";
import { Token } from "./Token";
import { Role } from "./Role";

export class Payload
{
    sub: number; // (id)
    school: SchoolType;
    role: Role;
    isAdmin: boolean;
    isMod: boolean;
    type: Token;
}