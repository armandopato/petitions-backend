import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetitionsModule } from './petitions/petitions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { UserModule } from './users/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './users/entities/school.entity';
import { Settings } from './users/entities/settings.entity';
import { Petition } from './petitions/entities/petition.entity';
import { Resolution } from './resolutions/entities/resolution.entity';
import { ResolutionComment } from './resolutions/entities/resolution-comment.entity';
import { PetitionComment } from './petitions/entities/petition-comment.entity';
import { StudentUser, SupportTeamUser, User } from './users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "armando",
      password: "armando",
      database: "peticiones-unam",
      entities: [User, StudentUser, SupportTeamUser, School, Settings, Petition, Resolution, ResolutionComment, PetitionComment],
      synchronize: true
  }),
    AuthModule,
    PetitionsModule,
    ResolutionsModule,
    UserModule
  ],
  controllers: [AppController]
})
export class AppModule {}
