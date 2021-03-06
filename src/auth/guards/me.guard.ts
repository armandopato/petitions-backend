import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from 'src/types/AuthRequest';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MeGuard implements CanActivate
{
    protectedMail: string;

    constructor(private configService: ConfigService)
    {
        this.protectedMail = this.configService.get<string>("MY_MAIL");
    }

    canActivate(context: ExecutionContext): boolean
    {
        const req: AuthRequest = context.switchToHttp().getRequest();
        return req.user.email === this.protectedMail;
    }
}