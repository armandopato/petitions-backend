import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtConfigService implements JwtOptionsFactory
{
    constructor(private configService: ConfigService) {
    }

    createJwtOptions(): JwtModuleOptions
    {
        const secret = this.configService.get<string>("JWT_SECRET");
        const expiration = this.configService.get<string>("JWT_EXPIRATION");
        return {
            secret: secret,
            signOptions: { expiresIn: expiration }
        };
    }
}