import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRequest } from 'src/auth/AuthRequest.interface';
import { Role } from 'src/users/Role';

@Injectable()
export class IsStudentGuard implements CanActivate
{
    canActivate(context: ExecutionContext): boolean
    {
        const req: AuthRequest = context.switchToHttp().getRequest();
        return req.user.role === Role.Student;
    }
}