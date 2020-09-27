import {
	ConflictException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { StudentUser, User } from '../users/entities/user.entity';
import { Page } from '../types/Page';
import { CommentInfo } from '../types/ElementInfo';
import { GenericComment, PetitionComment, ResolutionComment } from './comment.entity';
import { CommentsRepository, Entity } from './comments.repository';
import { ResolutionRepository } from '../posts/resolutions/resolutions.repository';
import { ResolutionStatus } from '../types/ElementStatus';

@Injectable()
export class CommentsService
{
	constructor(private commentsRepository: CommentsRepository,
	            private resolutionsRepository: ResolutionRepository)
	{
	}
	
	
	async getCommentInfoPage<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: User, page: number): Promise<Page<CommentInfo>>
	{
		const { totalPages, pageElements: comments } = await this.commentsRepository.getCommentsPage(elementId, commentEntity, page);
		let commentInfoArr: CommentInfo[];
		
		if (user)
		{
			commentInfoArr = await this.mapCommentsToAuthCommentsInfo(comments, commentEntity, user);
		}
		else
		{
			commentInfoArr = await this.mapCommentsToCommentsInfo(comments, commentEntity);
		}
		
		return {
			pageElements: commentInfoArr,
			totalPages,
		};
	}
	
	async getMyCommentInfo<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: StudentUser): Promise<CommentInfo>
	{
		return await this.getUserCommentInfo(elementId, commentEntity, user.id);
	}
	
	
	async postComment<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: StudentUser, commentText: string): Promise<void>
	{
		let newComment;
		if (commentEntity.constructor === ResolutionComment.constructor)
		{
			const resolution = await this.resolutionsRepository.findOne(elementId);
			if (!resolution) throw new NotFoundException();
			if (this.resolutionsRepository.getResolutionStatus(resolution) !== ResolutionStatus.TERMINATED) throw new ForbiddenException();
			newComment = new ResolutionComment();
		}
		else
		{
			newComment = new PetitionComment();
		}
		
		const userComment = await this.commentsRepository.getUserComment(elementId, commentEntity, user.id);
		if (userComment) throw new ConflictException();
		
		newComment.by = user;
		newComment.element = { id: elementId } as any;
		newComment.text = commentText;
		
		try
		{
			await this.commentsRepository.save(newComment, commentEntity);
		}
		catch (err)
		{
			if (err.code === '23503') throw new NotFoundException('Element does not exist');
			else throw new InternalServerErrorException();
		}
	}
	
	
	async editMyComment<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: StudentUser, newCommentText: string): Promise<void>
	{
		const userComment = await this.commentsRepository.getUserComment(elementId, commentEntity, user.id);
		if (!userComment) throw new NotFoundException();
		
		await this.commentsRepository.update(userComment, { text: newCommentText });
	}
	
	async deleteMyComment<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: StudentUser): Promise<void>
	{
		const comment = await this.commentsRepository.getUserComment(elementId, commentEntity, user.id);
		if (!comment) throw new NotFoundException();
		
		await this.commentsRepository.deleteComment(comment, commentEntity);
	}
	
	async likeOrDislikeComment<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>, user: StudentUser): Promise<void>
	{
		const didUserLikeComment = await this.commentsRepository.didUserLikeComment(commentId, commentEntity, user.id);
		
		try
		{
			if (didUserLikeComment)
			{
				await this.commentsRepository.dislikeComment(commentId, commentEntity, user.id);
			}
			else
			{
				await this.commentsRepository.likeComment(commentId, commentEntity, user.id);
			}
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
	}
	
	// CRUD
	async getCommentInfo<CommentType extends GenericComment>(comment: CommentType, commentEntity: Entity<CommentType>): Promise<CommentInfo>
	{
		return {
			id: comment.id,
			date: comment.createdDate,
			text: comment.text,
			numLikes: await this.commentsRepository.getNumberOfCommentLikes(comment.id, commentEntity),
		};
	}
	
	async getAuthCommentInfo<CommentType extends GenericComment>(comment: CommentType, commentEntity: Entity<CommentType>, user: User): Promise<CommentInfo>
	{
		const commentInfo = await this.getCommentInfo(comment, commentEntity);
		commentInfo.didLike = await this.commentsRepository.didUserLikeComment(comment.id, commentEntity, user.id);
		return commentInfo;
	}
	
	async mapCommentsToCommentsInfo<CommentType extends GenericComment>(comments: CommentType[], commentEntity: Entity<CommentType>): Promise<CommentInfo[]>
	{
		const commentsInfoArr: CommentInfo[] = [];
		
		for (const comment of comments)
		{
			const commentInfo = await this.getCommentInfo(comment, commentEntity);
			commentsInfoArr.push(commentInfo);
		}
		
		return commentsInfoArr;
	}
	
	async mapCommentsToAuthCommentsInfo<CommentType extends GenericComment>(comments: CommentType[], commentEntity: Entity<CommentType>, user: User): Promise<CommentInfo[]>
	{
		const authCommentsInfoArr: CommentInfo[] = [];
		
		for (const comment of comments)
		{
			const authCommentInfo = await this.getAuthCommentInfo(comment, commentEntity, user);
			authCommentsInfoArr.push(authCommentInfo);
		}
		
		return authCommentsInfoArr;
	}
	
	async getUserCommentInfo<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, userId: number): Promise<CommentInfo>
	{
		const comment = await this.commentsRepository.getUserComment(elementId, commentEntity, userId);
		if (!comment) throw new NotFoundException();
		return await this.getCommentInfo(comment, commentEntity);
	}
}
