import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/types/Payload';
import { Token } from 'src/types/Token';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RefreshGuard implements CanActivate
{
    constructor (@InjectRepository(User) private userRepository: Repository<User>,
                 private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean>
    {
        const req = context.switchToHttp().getRequest<Request>();
        const token = req.cookies.refresh_token as string;

        if (!token) throw new UnauthorizedException();
        try
        {
            const tokenPayload: Payload = await this.jwtService.verifyAsync(token);
            if (tokenPayload.type !== Token.REFRESH) throw new Error();

            const user = await this.userRepository.findOne(tokenPayload.sub);
            req.user = user;
            return true;
        }
        catch(err)
        {
            throw new UnauthorizedException();
        }
    }
}