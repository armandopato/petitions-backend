import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRequest } from 'src/auth/AuthRequest.interface';

@Injectable()
export class IsAdminGuard implements CanActivate
{
    canActivate(context: ExecutionContext): boolean
    {
        const req: AuthRequest = context.switchToHttp().getRequest();
        return req.user.hasAdminPrivileges;
    }
}