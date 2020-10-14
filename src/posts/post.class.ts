import { StudentUser, User } from '../users/entities/user.entity';
import { Page } from '../util/Page';
import { PageRepository } from '../util/PageRepository';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserInfo } from '../users/UserInfo';

export abstract class Post<T, TInfo extends UserInfo, TParams>
{
	abstract repository: PageRepository<T, TParams>;
	
	async getInfoById(postId: number, user: User): Promise<TInfo>
	{
		const post = await this.loadOne(postId);
		if (!post) throw new NotFoundException();
		
		const info = await this.getInfo(post);
		
		if (user)
		{
			return await this.addAuthInfo(info, user);
		}
		
		return info;
	}
	
	async getInfoPage(params: TParams, user: User): Promise<Page<TInfo>>
	{
		const page = await this.repository.getPage(params);
		return await this.pageToInfoPage(page, user);
	}
	
	async pageToInfoPage(page: Page<T>, user: User): Promise<Page<TInfo>>
	{
		const posts = page.pageElements;
		
		let postInfoArr = await Promise.all(posts.map(post => this.getInfo(post)));
		postInfoArr.forEach(this.propertyRemover);
		
		if (user)
		{
			postInfoArr = await Promise.all(postInfoArr.map(this.authInfoMapperGenerator(user)));
		}
		
		return {
			pageElements: postInfoArr,
			totalPages: page.totalPages,
		};
	}
	
	async saveOrUnsave(postId: number, user: User): Promise<void>
	{
		const didUserSave = await this.repository.didUserSave(postId, user.id);
		
		try
		{
			if (didUserSave)
			{
				await this.repository.unsavePost(postId, user.id);
			}
			else
			{
				await this.repository.savePost(postId, user.id);
			}
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
	}
	
	async vote(postId: number, user: StudentUser): Promise<void>
	{
		const post = await this.loadOne(postId);
		if (!post) throw new NotFoundException();
		
		if (this.checkVoteConstraint)
		{
			this.checkVoteConstraint(post);
		}
		
		const didUserVote = await this.repository.didUserVote(postId, user.id);
		if (didUserVote) throw new ConflictException();
		
		await this.repository.vote(postId, user.id);
		await this.triggerVoteLimitAction(post);
	}
	
	async addAuthInfo(info: TInfo, user: User): Promise<TInfo>
	{
		if (!this.isVoteInfoAvailable || this.isVoteInfoAvailable(info))
		{
			info.didVote = await this.repository.didUserVote(info.id, user.id);
		}
		info.didSave = await this.repository.didUserSave(info.id, user.id);
		return info;
	}
	
	authInfoMapperGenerator(user: User): (info: TInfo) => Promise<TInfo>
	{
		return (info: TInfo): Promise<TInfo> => this.addAuthInfo(info, user);
	}
	
	isVoteInfoAvailable?(info: TInfo): boolean;
	
	abstract async triggerVoteLimitAction(post: T): Promise<void>;
	
	checkVoteConstraint?(post: T): void;
	
	abstract async loadOne(id: number): Promise<T>;
	
	abstract async getInfo(post: T): Promise<TInfo>;
	
	abstract propertyRemover(info: TInfo): void;
}