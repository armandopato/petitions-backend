import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { StudentUser, User } from '../entities/user.entity';
import { Page } from '../types/Page';
import { CommentInfo } from '../types/ElementInfo';
import { GenericComment, PetitionComment } from '../entities/comment.entity';
import { CommentsRepository } from './comments.repository';
import { Entity } from './comments.repository';

@Injectable()
export class CommentsService
{
	constructor(private commentsRepository: CommentsRepository)
	{
	}
	
	
	async getCommentInfoPage<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: User, page: number): Promise<Page<CommentInfo>>
	{
		const { totalPages, pageElements: comments } = await this.commentsRepository.getCommentsPage(elementId, commentEntity, page);
		let commentInfoArr: CommentInfo[];
		
		if (user)
		{
			commentInfoArr = await this.commentsRepository.mapCommentsToAuthCommentsInfo(comments, commentEntity, user);
		}
		else
		{
			commentInfoArr = await this.commentsRepository.mapCommentsToCommentsInfo(comments, commentEntity);
		}
		
		return {
			pageElements: commentInfoArr,
			totalPages,
		};
	}
	
	async getMyCommentInfo<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: StudentUser): Promise<CommentInfo>
	{
		return await this.commentsRepository.getUserCommentInfo(elementId, commentEntity, user.id);
	}
	
	
	async postComment<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, user: StudentUser, commentText: string): Promise<void>
	{
		const userComment = await this.commentsRepository.getUserComment(elementId, commentEntity, user.id);
		if (userComment) throw new ConflictException();
		
		const newComment = new PetitionComment();
		newComment.by = user;
		newComment.element = { id: elementId } as any;
		newComment.text = commentText;
		try
		{
			await this.commentsRepository.save(newComment);
		}
		catch (err)
		{
			if (err.code === '23503') throw new NotFoundException("Element does not exist");
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
}
