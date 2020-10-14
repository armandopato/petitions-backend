import { EntityRepository } from 'typeorm';
import { ResolutionComment } from '../../../comments/comment.entity';
import { CommentsRepository } from '../../../comments/comments.repository';

@EntityRepository(ResolutionComment)
export class ResolutionCommentsRepository extends CommentsRepository<ResolutionComment>
{
	constructor()
	{
		super(ResolutionComment);
	}
}