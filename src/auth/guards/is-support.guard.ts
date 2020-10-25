import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { Role } from 'src/users/enums/role.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class IsSupportGuard implements CanActivate
{
    canActivate(context: ExecutionContext): boolean
    {
        const req: AuthRequest<User> = context.switchToHttp().getRequest();
        return req.user.role === Role.SupportTeam;
    }
}