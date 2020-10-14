import { Module } from '@nestjs/common';
import { ResolutionsRepository } from './resolutions.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsService } from './resolutions.service';
import { ResolutionsController } from './resolutions.controller';
import { PetitionsRepository } from 'src/posts/petitions/petitions.repository';
import { SchedulingModule } from 'src/scheduling/scheduling.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ResolutionCommentsService } from './comments/resolution-comments.service';
import { ResolutionCommentsRepository } from './comments/resolution-comments.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([ResolutionsRepository, PetitionsRepository, ResolutionCommentsRepository]),
		SchedulingModule,
		NotificationsModule,
	],
	providers: [ResolutionsService, ResolutionCommentsService],
	exports: [ResolutionsService],
	controllers: [ResolutionsController],
})
export class ResolutionsModule
{
}
