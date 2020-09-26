import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionComment, ResolutionComment } from '../entities/comment.entity';

@Module({
	imports: [TypeOrmModule.forFeature([PetitionComment, ResolutionComment])],
	providers: [CommentsService, CommentsRepository],
	exports: [CommentsService, CommentsRepository]
})
export class CommentsModule
{
}
