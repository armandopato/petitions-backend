import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from 'src/types/Payload';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from 'src/types/Token';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{

  constructor (@InjectRepository(User)
               private userRepository: Repository<User>,
               @Inject(ConfigService) private configService: ConfigService) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>("JWT_SECRET")
    });
  }

  async validate(payload: Payload): Promise<User>
  {
    if (payload.type !== Token.ACCESS) return null;
    
    return await this.userRepository.findOne(payload.sub);
  }
}