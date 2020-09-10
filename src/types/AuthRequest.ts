import { Request } from 'express';
import { StudentUser, User } from 'src/entities/user.entity';

export interface AuthRequest extends Request
{
    user: User;
}

export interface AuthStudentRequest extends Request
{
    user: StudentUser;
}