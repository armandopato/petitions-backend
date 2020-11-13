import { PetitionComment } from '../../../comments/comment.entity';
import { EntityRepository } from 'typeorm';
import { CommentsRepository } from '../../../comments/comments.repository';

@EntityRepository(PetitionComment)
export class PetitionCommentsRepository extends CommentsRepository<PetitionComment>
{
    constructor()
    {
        super(PetitionComment);
    }
}
