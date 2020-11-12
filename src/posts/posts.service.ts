import { StudentUser, User } from '../users/entities/user.entity';
import { Page } from '../util/page/page.interface';
import { PageRepository } from '../util/page/page-repository.interface';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserInfo } from '../users/interfaces/user-info.interface';
import { FOREIGN_KEY_VIOLATION_ERRCODE } from '../util/constants';

export abstract class PostsService<T, TInfo extends UserInfo, TParams>
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
			if (Number(err.code) === FOREIGN_KEY_VIOLATION_ERRCODE) throw new NotFoundException();
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
		const authInfo = { ...info };
		if (!this.isVoteInfoAvailable || this.isVoteInfoAvailable(authInfo))
		{
			authInfo.didVote = await this.repository.didUserVote(authInfo.id, user.id);
		}
		authInfo.didSave = await this.repository.didUserSave(authInfo.id, user.id);
		return authInfo;
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
