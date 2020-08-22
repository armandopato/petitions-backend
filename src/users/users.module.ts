import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { StudentUserRepository } from './users.repository';
import { SupportTeamUser, User } from 'src/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([StudentUserRepository, SupportTeamUser, User]),
            AuthModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
