import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from 'src/auth/interfaces/payload.interface';
import { User } from 'src/users/entities/user.entity';
import { Token } from 'src/auth/enums/token.enum';
import { UsersRepository } from '../../users/users.repository';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{
    
    constructor(private readonly usersRepository: UsersRepository,
                @Inject(ConfigService) private readonly configService: ConfigService)
    {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }
    
    async validate(payload: Payload): Promise<User>
    {
        if (payload.type !== Token.ACCESS) return null;
        
        return await this.usersRepository.findOne(payload.sub);
    }
}
