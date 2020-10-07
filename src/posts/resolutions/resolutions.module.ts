import { Module } from '@nestjs/common';
import { ResolutionRepository } from './resolutions.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsService } from './resolutions.service';
import { ResolutionsController } from './resolutions.controller';
import { PetitionRepository } from 'src/posts/petitions/petitions.repository';
import { SchedulingModule } from 'src/scheduling/scheduling.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ResolutionCommentService } from './resolution-comment/resolution-comment.service';
import { ResolutionCommentRepository } from './resolution-comment/resolution-comment.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([ResolutionRepository, PetitionRepository, ResolutionCommentRepository]),
		SchedulingModule,
		NotificationsModule
	],
	providers: [ResolutionsService, ResolutionCommentService],
	exports: [ResolutionsService],
	controllers: [ResolutionsController],
})
export class ResolutionsModule
{
}
