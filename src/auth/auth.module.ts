import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './config/jwt.config.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService, LocalStrategy, JwtConfigService],
  imports: [TypeOrmModule.forFeature([User]),
            JwtModule.registerAsync({
                useClass: JwtConfigService
            })
            ],
  exports: [MailService]
})
export class AuthModule {}
