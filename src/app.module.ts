import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetitionsModule } from './petitions/petitions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { UserModule } from './users/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './entities/school.entity';
import { Settings } from './entities/settings.entity';
import { StudentUser, SupportTeamUser, User } from './entities/user.entity';
import { Petition } from './entities/petition.entity';
import { Resolution } from './entities/resolution.entity';
import { UserNotification } from './entities/notification.entity';
import { ResolutionComment, PetitionComment } from './entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "armando",
      password: "armando",
      database: "peticiones-unam",
      entities: [User, StudentUser, SupportTeamUser, School, Settings, Petition, Resolution, ResolutionComment, PetitionComment, UserNotification],
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
