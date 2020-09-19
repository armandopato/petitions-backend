import { Request } from 'express';
import { StudentUser, SupportTeamUser, User } from 'src/entities/user.entity';

export interface AuthRequest extends Request
{
    user: User;
}

export interface AuthStudentRequest extends Request
{
    user: StudentUser;
}

export interface AuthSupportRequest extends Request
{
    user: SupportTeamUser;
}