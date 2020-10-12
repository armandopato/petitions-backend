import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetitionsModule } from './posts/petitions/petitions.module';
import { ResolutionsModule } from './posts/resolutions/resolutions.module';
import { UserModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulingModule } from './scheduling/scheduling.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				type: configService.get("DB_TYPE") as any,
				host: configService.get<string>("DB_HOST"),
				port: configService.get<number>("DB_PORT"),
				username: configService.get<string>("DB_USERNAME"),
				password: configService.get<string>("DB_PASSWORD"),
				database: configService.get<string>("DB_NAME"),
				entities: [configService.get<string>("DB_ENTITIES_PATH")],
				synchronize: configService.get<string>("DB_SYNC") == 'true',
				logging: configService.get<string>("DB_LOGGING") == 'true',
			}),
			inject: [ConfigService]
		}),
		AuthModule,
		PetitionsModule,
		ResolutionsModule,
		UserModule,
		SchedulingModule,
		NotificationsModule
	],
	controllers: [AppController],
})
export class AppModule
{
}