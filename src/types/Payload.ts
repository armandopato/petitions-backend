import { SchoolType } from "./School";
import { Token } from "./Token";

export class Payload
{
    sub: number; // (id)
    school: SchoolType;
    type: Token;
}