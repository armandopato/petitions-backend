import { getConnection, Repository } from 'typeorm';
import { Page } from 'src/types/Page';
import { getPage } from 'src/util/getPage';
import { GenericComment } from './comment.entity';
import { User } from '../users/entities/user.entity';

export type Entity<T> = { new(): T };

export abstract class CommentRepository<CommentType extends GenericComment> extends Repository<CommentType>
{
	connection = getConnection();
	
	protected constructor(private commentEntity: Entity<CommentType>)
	{
		super();
	}
	
	async countNumberOfComments(elementId: number): Promise<number>
	{
		return await this.connection.createQueryBuilder(this.commentEntity, 'comment')
			.innerJoinAndSelect('comment.element', 'element')
			.where('element.id = :id', { id: elementId })
			.getCount();
	}
	
	async getCommentsPage(elementId: number, page: number, user?: User): Promise<Page<CommentType>>
	{
		const query = this.connection.createQueryBuilder(this.commentEntity, 'comment')
			.innerJoin('comment.element', 'element')
			.where('element.id = :id', { id: elementId })
			.orderBy('comment.id', 'DESC');
		
		if (user)
		{
			query.andWhere('comment.by != :userid', { userid: user.id })
		}
		
		return await getPage(query, page);
	}
	
	async getUserComment(elementId: number, userId: number): Promise<CommentType>
	{
		return await this.connection.createQueryBuilder(this.commentEntity, 'comment')
			.innerJoin('comment.element', 'element')
			.innerJoin('comment.by', 'user')
			.where('element.id = :id', { id: elementId })
			.andWhere('user.id = :userId', { userId: userId })
			.getOne();
	}
	
	async getNumberOfCommentLikes(commentId: number): Promise<number>
	{
		return await this.connection.createQueryBuilder(this.commentEntity, 'comment')
			.innerJoin('comment.likedBy', 'user')
			.where('comment.id = :id', { id: commentId })
			.getCount();
	}
	
	async didUserLikeComment(commentId: number, userId: number): Promise<boolean>
	{
		const like = await this.connection.createQueryBuilder(this.commentEntity, 'comment')
			.innerJoin('comment.likedBy', 'user')
			.where('user.id = :userId', { userId: userId })
			.andWhere('comment.id = :id', { id: commentId })
			.getCount();
		return like === 1;
	}
	
	async deleteComment(comment: CommentType): Promise<void>
	{
		await this.connection.createQueryBuilder(this.commentEntity, 'comment')
			.delete()
			.where('id = id', { id: comment.id })
			.execute();
	}
	
	async likeComment(commentId: number, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(this.commentEntity, 'likedBy')
			.of(commentId)
			.add(userId);
	}
	
	async dislikeComment(commentId: number, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(this.commentEntity, 'likedBy')
			.of(commentId)
			.remove(userId);
	}
}