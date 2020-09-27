import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionComment, ResolutionComment } from './comment.entity';
import { ResolutionRepository } from '../posts/resolutions/resolutions.repository';

@Module({
	imports: [TypeOrmModule.forFeature([PetitionComment, ResolutionComment, ResolutionRepository])],
	providers: [CommentsService, CommentsRepository],
	exports: [CommentsService, CommentsRepository]
})
export class CommentsModule
{
}
