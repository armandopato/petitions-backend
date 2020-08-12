import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetitionsModule } from './petitions/petitions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { UserModule } from './users/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { School } from './users/additional-entities/school.entity';
import { Settings } from './users/additional-entities/settings.entity';
import { Petition } from './petitions/petition.entity';
import { Resolution } from './resolutions/resolution.entity';
import { ResolutionComment } from './resolutions/resolution-comment.entity';
import { PetitionComment } from './petitions/petition-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "armando",
      password: "armando",
      database: "peticiones-unam",
      entities: [User, School, Settings, Petition, Resolution, ResolutionComment, PetitionComment],
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
