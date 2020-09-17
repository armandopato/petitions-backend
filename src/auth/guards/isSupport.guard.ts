import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from 'src/types/AuthRequest';
import { Role } from 'src/types/Role';

@Injectable()
export class IsSupportGuard implements CanActivate
{
    canActivate(context: ExecutionContext): boolean
    {
        const req: AuthRequest = context.switchToHttp().getRequest();
        return req.user.role === Role.SupportTeam;
    }
}