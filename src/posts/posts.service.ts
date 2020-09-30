import { forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Page } from '../types/Page';
import { Post } from '../types/Post.interface';
import { PetitionsService } from './petitions/petitions.service';
import { ResolutionsService } from './resolutions/resolutions.service';
import { ResolutionQueryParams } from './resolutions/dto/resolution-query.params.dto';
import { PetitionQueryParams } from './petitions/dto/petition-query-params.dto';
import { PetitionInfo, ResolutionInfo } from '../types/ElementInfo';
import { Petition } from './petitions/petition.entity';
import { Resolution } from './resolutions/resolution.entity';
import { Entity } from '../comments/comments.repository';

@Injectable()
export class PostsService
{
	constructor(
				@Inject(forwardRef(() => PetitionsService))
				private petitionsService: PetitionsService,
	            @Inject(forwardRef(() => ResolutionsService))
	            private resolutionsService: ResolutionsService)
	{
	}
	
	async getPostsInfoPage<TInfo>(postType: Entity<Petition> | Entity<Resolution>, params: PetitionQueryParams | ResolutionQueryParams, user: User): Promise<Page<TInfo>>
	{
		const service = postType === Petition ? this.petitionsService : this.resolutionsService;
		const page = await service.repository.getPage(params as any);
		
		const posts = page.pageElements as (Resolution | Petition)[];
		
		let postInfoArr = await Promise.all(posts.map(service.infoMapper)) as any;
		postInfoArr.forEach(service.propertyRemover);
		
		if (user)
		{
			postInfoArr = await Promise.all(postInfoArr.map(service.authInfoMapperGenerator(user)));
		}
		
		return {
			pageElements: postInfoArr,
			totalPages: page.totalPages,
		};
	}
	
	async getPostInfoById<TInfo>(postType: Entity<Petition> | Entity<Resolution>, postId: number, user: User): Promise<TInfo>
	{
		let post, service;
		if (postType === Petition)
		{
			service = this.petitionsService;
			post = await service.repository.findOne(postId);
		}
		else
		{
			service = this.resolutionsService;
			post = await service.repository.findOne(postId, { relations: ['petition'] });
		}
		if (!post) throw new NotFoundException();
		
		const info = await service.getInfo(post);
		
		if (user)
		{
			return await service.addAuthInfo(info, user);
		}
		
		return info;
	}
	
	async saveOrUnsavePost(postType: Entity<Petition> | Entity<Resolution>, postId: number, user: User): Promise<void>
	{
		const service = postType === Petition ? this.petitionsService : this.resolutionsService;
		const didUserSave = await service.repository.didUserSave(postId, user.id);
		
		try
		{
			if (didUserSave)
			{
				await service.repository.unsavePost(postId, user.id);
			}
			else
			{
				await service.repository.savePost(postId, user.id)
			}
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
	}
	/*
	// very generic
	async votePost(petitionId: number, user: StudentUser): Promise<void>
	{
		const didUserVote = await this.petitionRepository.didUserVote(petitionId, user.id);
		if (didUserVote) throw new ConflictException();
		
		try
		{
			await this.petitionRepository.votePetition(petitionId, user.id);
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
		if (await this.petitionRepository.countNumberOfVotes(petitionId) >= MIN_VOTES)
		{
			await this.resolutionsService.createAssociatedResolution(petitionId);
		}
	}
	
	add auth info
	
	*/
	
}
