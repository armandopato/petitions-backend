import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';

export interface AuthRequest<T extends User> extends Request
{
    user: T;
}