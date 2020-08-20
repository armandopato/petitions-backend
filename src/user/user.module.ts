import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { StudentUserRepository } from './user.repository';
import { SupportTeamUser, User } from 'src/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([StudentUserRepository, SupportTeamUser, User]),
            AuthModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
