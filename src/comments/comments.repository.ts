import { getConnection, Repository } from 'typeorm';
import { Page } from 'src/types/Page';
import { getPage } from 'src/util/getPage';
import { Injectable } from '@nestjs/common';
import { GenericComment, PetitionComment, ResolutionComment } from './comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export type Entity<T> = { new(): T };

@Injectable()
export class CommentsRepository
{
	connection = getConnection();
	
	constructor(
		@InjectRepository(PetitionComment)
		private petitionsCommentRepository: Repository<PetitionComment>,
		@InjectRepository(ResolutionComment)
		private resolutionsCommentRepository: Repository<ResolutionComment>,
	)
	{
	}
	
	async countNumberOfComments<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>): Promise<number>
	{
		return await this.connection.createQueryBuilder(commentEntity, 'comment')
			.innerJoinAndSelect('comment.element', 'element')
			.where('element.id = :id', { id: elementId })
			.getCount();
	}
	
	async save<CommentType extends GenericComment>(comment: CommentType, commentEntity: Entity<CommentType>): Promise<void>
	{
		await this.connection.createQueryBuilder(commentEntity, "comment")
			.insert()
			.values(comment as any)
			.execute();
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
		const query = this.connection.createQueryBuilder(commentEntity, 'comment')
			.innerJoin('comment.element', 'element')
			.where('element.id = :id', { id: elementId })
			.orderBy('comment.id', 'DESC');
		
		return await getPage(query, page);
	}
	
	async getUserComment<CommentType extends GenericComment>(elementId: number, commentEntity: Entity<CommentType>, userId: number): Promise<CommentType>
	{
		return await this.connection.createQueryBuilder(commentEntity, 'comment')
			.innerJoin('comment.element', 'element')
			.innerJoin('comment.by', 'user')
			.where('element.id = :id', { id: elementId })
			.andWhere('user.id = :userId', { userId: userId })
			.getOne();
	}
	
	async getNumberOfCommentLikes<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>): Promise<number>
	{
		return await this.connection.createQueryBuilder(commentEntity, 'comment')
			.innerJoin('comment.likedBy', 'user')
			.where('comment.id = :id', { id: commentId })
			.getCount();
	}
	
	async didUserLikeComment<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>, userId: number): Promise<boolean>
	{
		const like = await this.connection.createQueryBuilder(commentEntity, 'comment')
			.innerJoin('comment.likedBy', 'user')
			.where('user.id = :userId', { userId: userId })
			.andWhere('comment.id = :id', { id: commentId })
			.getCount();
		return like === 1;
	}
	
	async deleteComment<CommentType extends GenericComment>(comment: CommentType, commentEntity: Entity<CommentType>): Promise<void>
	{
		await this.connection.createQueryBuilder(commentEntity, 'comment')
			.delete()
			.where('id = id', { id: comment.id })
			.execute();
	}
	
	async likeComment<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(commentEntity as any, 'likedBy')
			.of(commentId)
			.add(userId);
	}
	
	async dislikeComment<CommentType extends GenericComment>(commentId: number, commentEntity: Entity<CommentType>, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(commentEntity as any, 'likedBy')
			.of(commentId)
			.remove(userId);
	}
}