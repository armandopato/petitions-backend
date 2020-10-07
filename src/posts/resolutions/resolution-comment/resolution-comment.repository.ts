import { EntityRepository } from 'typeorm';
import { ResolutionComment } from '../../../comments/comment.entity';
import { CommentRepository } from '../../../comments/comment.repository';

@EntityRepository(ResolutionComment)
export class ResolutionCommentRepository extends CommentRepository<ResolutionComment>
{
	constructor()
	{
		super(ResolutionComment);
	}
}