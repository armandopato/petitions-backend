import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtConfigService implements JwtOptionsFactory
{
    constructor(private readonly configService: ConfigService)
    {
    }

    createJwtOptions(): JwtModuleOptions
    {
        const secret = this.configService.get<string>("JWT_SECRET");
        return {
            secret: secret
        };
    }
}
