import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from 'src/types/AuthRequest';

@Injectable()
export class IsAdminGuard implements CanActivate
{
    canActivate(context: ExecutionContext): boolean
    {
        const req: AuthRequest = context.switchToHttp().getRequest();
        return req.user.hasAdminPrivileges;
    }
}