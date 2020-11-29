import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentsService } from '../../../comments/comments.service';
import { ResolutionComment } from '../../../comments/comment.entity';
import { ResolutionsRepository } from '../resolutions.repository';
import { ResolutionCommentsRepository } from './resolution-comments.repository';
import { ResolutionStatus } from '../enums/resolution-status.enum';

@Injectable()
export class ResolutionCommentsService extends CommentsService<ResolutionComment>
{
    constructor(resolutionCommentsRepository: ResolutionCommentsRepository,
                private readonly resolutionsRepository: ResolutionsRepository)
    {
        super(resolutionCommentsRepository);
    }
    
    async createNewInstanceWithConditions(elementId: number): Promise<ResolutionComment>
    {
        const resolution = await this.resolutionsRepository.findOne(elementId);
        if (!resolution) throw new NotFoundException();
        if (this.resolutionsRepository.getStatus(resolution) !==
            ResolutionStatus.TERMINATED) throw new ForbiddenException();
        return new ResolutionComment();
    }
    
}
