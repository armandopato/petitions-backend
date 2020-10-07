import { PetitionComment } from '../../../comments/comment.entity';
import { EntityRepository } from 'typeorm';
import { CommentRepository } from '../../../comments/comment.repository';

@EntityRepository(PetitionComment)
export class PetitionCommentRepository extends CommentRepository<PetitionComment>
{
	constructor()
	{
		super(PetitionComment);
	}
}