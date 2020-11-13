import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './config/jwt.config.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersRepository } from '../users/users.repository';

@Module({
    controllers: [AuthController],
    providers: [AuthService, MailService, LocalStrategy, JwtStrategy, JwtConfigService],
    imports: [TypeOrmModule.forFeature([UsersRepository]),
        JwtModule.registerAsync({
            imports: [AuthModule],
            useExisting: JwtConfigService,
        }),
    ],
    exports: [MailService, JwtConfigService, JwtModule],
})
export class AuthModule
{
}
