import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SchedulingService } from './scheduling/scheduling.service';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

async function bootstrap()
{
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		forbidUnknownValues: true,
		transform: true,
		//stopAtFirstError: true,
	}));
	app.use(cookieParser());
	app.use(helmet());
	app.use(
		rateLimit({
			windowMs: 15 * 60 * 1000, // 15 minutes
			max: 100, // limit each IP to 100 requests per windowMs
		}),
	);
	await app.get(SchedulingService).initialResolutionDeadlineScheduling();
	await app.listen(3000);
}

bootstrap();