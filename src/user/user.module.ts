import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { StudentUserRepository } from './user.repository';
import { SupportTeamUser } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentUserRepository, SupportTeamUser])],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
