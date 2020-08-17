import { SchoolType } from "src/types/School";

export interface CreateUserRes
{
    id: number;
    email: string;
    school: SchoolType;
}