import { Inject, Injectable } from '@nestjs/common';
import { CommentsService } from '../../../comments/comments.service';
import { PetitionComment } from '../../../comments/comment.entity';
import { PetitionCommentsRepository } from './petition-comments.repository';

@Injectable()
export class PetitionCommentsService extends CommentsService<PetitionComment>
{
	constructor(@Inject(PetitionCommentsRepository) petitionCommentRepository: PetitionCommentsRepository)
	{
		super(petitionCommentRepository);
	}
	
	async createCommentInstanceWithConditions(): Promise<PetitionComment>
	{
		return new PetitionComment();
	}
}
