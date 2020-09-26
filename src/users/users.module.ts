import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { StudentUserRepository, SupportTeamUserRepository, UserRepository } from './users.repository';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/auth/config/jwt.config.service';
import { Settings } from 'src/entities/settings.entity';
import { PetitionsModule } from 'src/petitions/petitions.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ResolutionsModule } from '../resolutions/resolutions.module';

@Module({
  imports: [TypeOrmModule.forFeature([StudentUserRepository, SupportTeamUserRepository, UserRepository, Settings]),
            AuthModule,
            NotificationsModule,
            PetitionsModule,
            ResolutionsModule,
            JwtModule.registerAsync({
              imports: [AuthModule],
              useExisting: JwtConfigService
            })],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
