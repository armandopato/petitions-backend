import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AbstractCommentsService } from '../../../comments/comment.class';
import { ResolutionComment } from '../../../comments/comment.entity';
import { ResolutionRepository } from '../resolutions.repository';
import { ResolutionStatus } from '../../ElementStatus';
import { ResolutionCommentRepository } from './resolution-comment.repository';

@Injectable()
export class ResolutionCommentService extends AbstractCommentsService<ResolutionComment>
{
	constructor(@Inject(ResolutionCommentRepository) resolutionCommentRepository: ResolutionCommentRepository,
	            private resolutionsRepository: ResolutionRepository)
	{
		super(resolutionCommentRepository);
	}
	
	async createCommentInstanceWithConditions(elementId: number): Promise<ResolutionComment>
	{
		const resolution = await this.resolutionsRepository.findOne(elementId);
		if (!resolution) throw new NotFoundException();
		if (this.resolutionsRepository.getResolutionStatus(resolution) !== ResolutionStatus.TERMINATED) throw new ForbiddenException();
		return new ResolutionComment();
	}
	
}
