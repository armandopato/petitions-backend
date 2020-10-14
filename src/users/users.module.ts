import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { StudentUsersRepository, UsersRepository } from './users.repository';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/auth/config/jwt.config.service';
import { PetitionsModule } from 'src/posts/petitions/petitions.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ResolutionsModule } from '../posts/resolutions/resolutions.module';

@Module({
    imports: [TypeOrmModule.forFeature([StudentUsersRepository, UsersRepository]),
        AuthModule,
        NotificationsModule,
        PetitionsModule,
        ResolutionsModule,
        JwtModule.registerAsync({
            imports: [AuthModule],
            useExisting: JwtConfigService,
        })],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule
{
}
