import { getConnection, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Page } from 'src/types/Page';
import { getPage } from 'src/util/getPage';
import { CommentInfo } from 'src/types/ElementInfo';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericComment, PetitionComment, ResolutionComment } from '../entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export type Entity<T> = { new(): T };

@Injectable()
export class CommentsRepository
{
	constructor(
		@InjectRepository(PetitionComment)
		private petitionsCommentRepository: Repository<PetitionComment>,
		@InjectRepository(ResolutionComment)
		private resolutionsCommentRepository: Repository<ResolutionComment>
		)
	{
	}
	
	connection = getConnection();
	
	async countNumberOfComments<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>): Promise<number>
	{
		return await this.connection.createQueryBuilder(commentEntity, "comment")
			.innerJoinAndSelect("comment.element", "element")
			.where("element.id = :id", { id: elementId })
			.getCount();
	}
	
	async save<CommentType extends GenericComment>(comment: CommentType): Promise<void>
	{
		if (comment instanceof PetitionComment)
		{
			await this.petitionsCommentRepository.save(comment);
		}
		else if (comment instanceof ResolutionComment)
		{
			await this.resolutionsCommentRepository.save(comment);
		}
	}
	
	async update<CommentType extends GenericComment>(comment: CommentType, partial: QueryDeepPartialEntity<unknown>): Promise<void>
	{
		if (comment instanceof PetitionComment)
		{
			await this.petitionsCommentRepository.update(comment.id, partial);
		}
		else if (comment instanceof ResolutionComment)
		{
			await this.resolutionsCommentRepository.update(comment.id, partial);
		}
	}
	
	
	async getCommentsPage<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, page: number): Promise<Page<CommentType>>
	{
		const query = this.connection.createQueryBuilder(commentEntity, "comment")
			.innerJoin("comment.element", "element")
			.where("element.id = :id", { id: elementId })
			.orderBy("comment.id", "DESC");
		
		return await getPage(query, page);
	}
	
	async getUserComment<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, userId: number): Promise<CommentType>
	{
		return await this.connection.createQueryBuilder(commentEntity, "comment")
			.innerJoin("comment.element", "element")
			.innerJoin("comment.by", "user")
			.where("element.id = :id", { id: elementId })
			.andWhere("user.id = :userId", { userId: userId })
			.getOne();
	}
	
	async getUserCommentInfo<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, userId: number): Promise<CommentInfo>
	{
		const comment = await this.getUserComment(elementId, commentEntity, userId);
		if (!comment) throw new NotFoundException();
		return await this.getCommentInfo(comment, commentEntity);
	}
	
	
	async getNumberOfCommentLikes<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>): Promise<number>
	{
		return await this.connection.createQueryBuilder(commentEntity, "comment")
			.innerJoin("comment.likedBy", "user")
			.where("comment.id = :id", { id: commentId })
			.getCount();
	}
	
	async didUserLikeComment<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>, userId: number): Promise<boolean>
	{
		const like = await this.connection.createQueryBuilder(commentEntity, "comment")
			.innerJoin("comment.likedBy", "user")
			.where("user.id = :userId", { userId: userId })
			.andWhere("comment.id = :id", { id: commentId })
			.getCount();
		return like === 1;
	}
	
	async getCommentInfo<CommentType extends GenericComment>(comment: CommentType, commentEntity: Entity<CommentType>): Promise<CommentInfo>
	{
		return {
			id: comment.id,
			date: comment.createdDate,
			text: comment.text,
			numLikes: await this.getNumberOfCommentLikes(comment.id, commentEntity)
		};
	}
	
	async getAuthCommentInfo<CommentType extends GenericComment>(comment: CommentType, commentEntity: Entity<CommentType>, user: User): Promise<CommentInfo>
	{
		const commentInfo = await this.getCommentInfo(comment, commentEntity);
		commentInfo.didLike = await this.didUserLikeComment(comment.id, commentEntity, user.id)
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
	
	async deleteComment<CommentType extends GenericComment>(comment: CommentType, commentEntity: Entity<CommentType>): Promise<void>
	{
		await this.connection.createQueryBuilder(commentEntity, "comment")
			.delete()
			.where("id = id", { id: comment.id })
			.execute();
	}
	
	async likeComment<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(commentEntity as any, "likedBy")
			.of(commentId)
			.add(userId);
	}
	
	async dislikeComment<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(commentEntity as any, "likedBy")
			.of(commentId)
			.remove(userId);
	}
}