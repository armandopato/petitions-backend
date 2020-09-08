import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { StudentUserRepository, SupportTeamUserRepository, UserRepository } from './users.repository';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/auth/config/jwt.config.service';
import { PetitionRepository } from 'src/petitions/petitions.repository';
import { ResolutionRepository } from 'src/resolutions/resolutions.repository';
import { Settings } from 'src/entities/settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentUserRepository, SupportTeamUserRepository, UserRepository, PetitionRepository, ResolutionRepository, Settings]),
            AuthModule,
            JwtModule.registerAsync({
              imports: [AuthModule],
              useExisting: JwtConfigService
            })],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
