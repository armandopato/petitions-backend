import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetitionsModule } from './posts/petitions/petitions.module';
import { ResolutionsModule } from './posts/resolutions/resolutions.module';
import { UserModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SchedulingModule } from './scheduling/scheduling.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';
import { ElementsModule } from './elements/elements.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRoot(),
		AuthModule,
		PetitionsModule,
		ResolutionsModule,
		UserModule,
		SchedulingModule,
		NotificationsModule,
		CommentsModule,
		ElementsModule
	],
	controllers: [AppController],
})
export class AppModule
{

}
