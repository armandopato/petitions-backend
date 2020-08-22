import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetitionsModule } from './petitions/petitions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { UserModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(),
    AuthModule,
    PetitionsModule,
    ResolutionsModule,
    UserModule
  ],
  controllers: [AppController]
})
export class AppModule {}
