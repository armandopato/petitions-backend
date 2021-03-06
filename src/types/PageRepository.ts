import { Repository } from 'typeorm';
import { Page } from './Page';

export interface PageRepository<T, TParams> extends Repository<T>
{
	getPage(params: TParams): Promise<Page<T>>;
	didUserSave(postId: number, userId: number): Promise<boolean>;
	savePost(postId: number, userId: number): Promise<void>;
	unsavePost(postId: number, userId: number): Promise<void>;
	didUserVote(postId: number, userId: number): Promise<boolean>;
	vote(postId: number, userId: number): Promise<void>;
}