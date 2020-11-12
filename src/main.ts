import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SchedulingService } from './scheduling/scheduling.service';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';
import { MINUTE_MILLISECONDS } from './util/constants';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
			windowMs: 15 * MINUTE_MILLISECONDS,
			max: 100, // limit each IP to 100 requests per windowMs
		}),
	);
	const options = new DocumentBuilder()
		.setTitle('UNAM Petitions platform')
		.setDescription('REST API for UNAM petitions platform')
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('api', app, document);
	
	await app.get(SchedulingService).initialResolutionDeadlineScheduling();
	const PORT = await app.get(ConfigService).get<string>('PORT');
	await app.listen(PORT);
}

bootstrap();
