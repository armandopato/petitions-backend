import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Payload } from 'src/auth/interfaces/payload.interface';
import { Token } from 'src/auth/enums/token.enum';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class RefreshGuard implements CanActivate
{
    constructor(private readonly usersRepository: UsersRepository,
                private readonly jwtService: JwtService)
    {
    }
    
    async canActivate(context: ExecutionContext): Promise<boolean>
    {
        const req = context.switchToHttp().getRequest<Request>();
        const token = req.cookies.refresh_token as string;
        
        if (!token) throw new UnauthorizedException();
        try
        {
            const tokenPayload: Payload = await this.jwtService.verifyAsync(token);
            if (tokenPayload.type !== Token.REFRESH) throw new Error();
    
            const user = await this.usersRepository.findOne(tokenPayload.sub);
            if (!user) throw new Error();
            
            req.user = user;
            return true;
        }
        catch(err)
        {
            throw new UnauthorizedException();
        }
    }
}
