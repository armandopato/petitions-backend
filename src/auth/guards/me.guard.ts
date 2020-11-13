import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class MeGuard implements CanActivate
{
    private readonly protectedMail: string;
    
    constructor(private readonly configService: ConfigService)
    {
        this.protectedMail = this.configService.get<string>('MY_MAIL');
    }
    
    canActivate(context: ExecutionContext): boolean
    {
        const req: AuthRequest<User> = context.switchToHttp().getRequest();
        return req.user.email === this.protectedMail;
    }
}
