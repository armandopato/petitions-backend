import { Injectable } from '@nestjs/common';
import { CommentsService } from '../../../comments/comments.service';
import { PetitionComment } from '../../../comments/comment.entity';
import { PetitionCommentsRepository } from './petition-comments.repository';

@Injectable()
export class PetitionCommentsService extends CommentsService<PetitionComment>
{
    constructor(petitionCommentRepository: PetitionCommentsRepository)
    {
        super(petitionCommentRepository);
    }
    
    async createNewInstanceWithConditions(): Promise<PetitionComment>
    {
        return new PetitionComment();
    }
}
