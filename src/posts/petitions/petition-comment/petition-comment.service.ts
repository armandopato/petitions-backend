import { Inject, Injectable } from '@nestjs/common';
import { AbstractCommentsService } from '../../../comments/comment.class';
import { PetitionComment } from '../../../comments/comment.entity';
import { PetitionCommentRepository } from './petition-comment.repository';

@Injectable()
export class PetitionCommentService extends AbstractCommentsService<PetitionComment>
{
	constructor(@Inject(PetitionCommentRepository) petitionCommentRepository: PetitionCommentRepository)
	{
		super(petitionCommentRepository);
	}
	
	async createCommentInstanceWithConditions(): Promise<PetitionComment>
	{
		return new PetitionComment();
	}
}
