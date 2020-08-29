import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { StudentUserRepository, SupportTeamUserRepository } from './users.repository';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/auth/config/jwt.config.service';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentUserRepository, SupportTeamUserRepository, User]),
            AuthModule,
            JwtModule.registerAsync({
              imports: [AuthModule],
              useExisting: JwtConfigService
            })],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
