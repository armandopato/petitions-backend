import { CommentRepository } from './comment.repository';
import { GenericComment } from './comment.entity';
import { StudentUser, User } from '../users/entities/user.entity';
import { Page } from '../types/Page';
import { CommentInfo } from '../types/ElementInfo';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

export abstract class AbstractCommentsService<CommentType extends GenericComment>
{
	protected constructor(private commentsRepository: CommentRepository<CommentType>)
	{
	}
	
	async getCommentInfoPage(elementId: number, user: User, pageNumber: number): Promise<Page<CommentInfo>>
	{
		const page = await this.commentsRepository.getCommentsPage(elementId, pageNumber, user);
		return await this.pageToInfoPage(user, page);
	}
	
	async pageToInfoPage(user: User, page: Page<CommentType>): Promise<Page<CommentInfo>>
	{
		const comments = page.pageElements;
		let postInfoArr = await Promise.all(comments.map(comment => this.getCommentInfo(comment)));
		
		if (user)
		{
			postInfoArr = await Promise.all(postInfoArr.map(info => this.addAuthInfo(user, info)));
		}
		
		return {
			pageElements: postInfoArr,
			totalPages: page.totalPages,
		};
	}
	
	async getMyCommentInfo<CommentType extends GenericComment>(elementId: number, user: StudentUser): Promise<CommentInfo>
	{
		const comment = await this.commentsRepository.getUserComment(elementId, user.id);
		if (!comment) throw new NotFoundException();
		const info = await this.getCommentInfo(comment);
		return await this.addAuthInfo(user, info);
	}
	
	abstract async createCommentInstanceWithConditions(elementId?: number): Promise<CommentType>;
	
	async postComment<CommentType extends GenericComment>(elementId: number, user: StudentUser, commentText: string): Promise<void>
	{
		const userComment = await this.commentsRepository.getUserComment(elementId, user.id);
		if (userComment) throw new ConflictException();
		
		const newComment = await this.createCommentInstanceWithConditions(elementId);
		newComment.by = user;
		newComment.element = { id: elementId };
		newComment.text = commentText;
		
		try
		{
			await this.commentsRepository.save(newComment as any);
		}
		catch (err)
		{
			if (err.code === '23503') throw new NotFoundException('Post does not exist');
			else throw new InternalServerErrorException();
		}
	}
	
	async editMyComment(elementId: number, user: StudentUser, newCommentText: string): Promise<void>
	{
		const userComment = await this.commentsRepository.getUserComment(elementId, user.id);
		if (!userComment) throw new NotFoundException();
		
		await this.commentsRepository.update(userComment.id, { text: newCommentText } as any);
	}
	
	async deleteMyComment(elementId: number, user: StudentUser): Promise<void>
	{
		const comment = await this.commentsRepository.getUserComment(elementId, user.id);
		if (!comment) throw new NotFoundException();
		
		await this.commentsRepository.deleteComment(comment);
	}
	
	async likeOrDislikeComment(commentId: number, user: StudentUser): Promise<void>
	{
		const didUserLikeComment = await this.commentsRepository.didUserLikeComment(commentId, user.id);
		
		try
		{
			if (didUserLikeComment)
			{
				await this.commentsRepository.dislikeComment(commentId, user.id);
			}
			else
			{
				await this.commentsRepository.likeComment(commentId, user.id);
			}
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
	}
	
	async countNumberOfComments(postId: number): Promise<number>
	{
		return await this.commentsRepository.countNumberOfComments(postId);
	}
	
	async getCommentInfo(comment: CommentType): Promise<CommentInfo>
	{
		return {
			id: comment.id,
			date: comment.createdDate,
			text: comment.text,
			numLikes: await this.commentsRepository.getNumberOfCommentLikes(comment.id),
		};
	}
	
	async addAuthInfo(user: User, commentInfo: CommentInfo): Promise<CommentInfo>
	{
		commentInfo.didLike = await this.commentsRepository.didUserLikeComment(commentInfo.id, user.id);
		return commentInfo;
	}
}