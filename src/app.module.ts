import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetitionsModule } from './petitions/petitions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    AuthModule,
    PetitionsModule,
    ResolutionsModule,
    UserModule
  ],
  controllers: [AppController]
})
export class AppModule {}
