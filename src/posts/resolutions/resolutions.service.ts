import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { StudentUser, SupportTeamUser, User } from 'src/users/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PetitionRepository } from 'src/posts/petitions/petitions.repository';
import { SchedulingService } from 'src/scheduling/scheduling.service';
import { ResolutionInfo } from 'src/types/ElementInfo';
import { PetitionStatus, ResolutionStatus } from 'src/types/ElementStatus';
import { Page } from 'src/types/Page';
import { PostTerminatedResolutionDto } from './dto/post-terminated-resolution.dto';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionRepository } from './resolutions.repository';
import { CommentsRepository } from '../../comments/comments.repository';
import { ResolutionComment } from '../../comments/comment.entity';
import { PostsService } from '../posts.service';
import * as _ from 'lodash';

const DAY = 1000 * 60 * 60 * 24;
const RESOLUTION_WINDOW = DAY * 30;
const MIN_VOTES = 50;

@Injectable()
export class ResolutionsService
{
	constructor(private resolutionsRepository: ResolutionRepository,
	            private commentsRepository: CommentsRepository,
	            private petitionsRepository: PetitionRepository,
	            private schedulingService: SchedulingService,
	            private notificationsService: NotificationsService,
	            private postsService: PostsService)
	{
	}
	
	async getResolutionsPageBySchool(params: ResolutionQueryParams, user: User): Promise<Page<ResolutionInfo>>
	{
		function propertyRemover(info: ResolutionInfo): void
		{
			info.resolutionText = undefined;
		}
		
		const page = await this.resolutionsRepository.getResolutionsPage(params);
		const getInfoPage = _.partial(this.postsService.getPostsInfoPage, page, this.getResolutionInfo.bind(this), propertyRemover)
		
		if (user)
		{
			return await getInfoPage(info => this.addAuthInfo(info, user));
		}
		
		return await getInfoPage(undefined);
	}
	
	async getResolutionInfoById(resolutionId: number, user: User): Promise<ResolutionInfo>
	{
		const resolution = await this.resolutionsRepository.findOne(resolutionId, { relations: ['petition'] });
		if (!resolution) throw new NotFoundException();
		
		const info = await this.getResolutionInfo(resolution);
		
		if (user)
		{
			return await this.addAuthInfo(info, user);
		}
		
		return info;
	}
	
	async saveOrUnsaveResolution(resolutionId: number, user: User): Promise<void>
	{
		const didUserSave = await this.resolutionsRepository.didUserSave(resolutionId, user.id);
		
		try
		{
			if (didUserSave)
			{
				await this.resolutionsRepository.unsaveResolution(resolutionId, user.id);
			}
			else
			{
				await this.resolutionsRepository.saveResolution(resolutionId, user.id);
			}
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
	}
	
	async resolvePetition(postTerminatedResolutionDto: PostTerminatedResolutionDto, supportUser: SupportTeamUser): Promise<number>
	{
		const { petitionId, resolutionText } = postTerminatedResolutionDto;
		const newResolution = await this.createAssociatedResolution(petitionId, supportUser);
		
		await this.terminateResolution(newResolution, supportUser, resolutionText);
		return newResolution.id;
	}
	
	
	async terminateResolution(resolutionOrId: number | Resolution, supportUser: SupportTeamUser, resolutionText: string): Promise<void>
	{
		const resolution = typeof resolutionOrId === 'number' ? await this.resolutionsRepository.findOne(resolutionOrId, { relations: ['petition'] }) : resolutionOrId;
		
		if (!resolution) throw new NotFoundException();
		if (resolution.petition.campus !== supportUser.school.campus) throw new UnauthorizedException();
		if (this.resolutionsRepository.getResolutionStatus(resolution) === ResolutionStatus.TERMINATED) throw new ConflictException();
		
		resolution.by = supportUser;
		resolution.resolutionText = resolutionText;
		resolution.resolutionDate = new Date(Date.now());
		
		await this.resolutionsRepository.save(resolution);
		this.schedulingService.cancelResolutionDeadline(resolution.id);
		await this.notificationsService.triggerNotifications(resolution);
	}
	
	async createAssociatedResolution(petitionId: number, supportUser?: SupportTeamUser): Promise<Resolution>
	{
		const associatedPetition = await this.petitionsRepository.findOne(petitionId);
		if (!associatedPetition) throw new NotFoundException();
		if (await this.petitionsRepository.getPetitionStatus(petitionId) !== PetitionStatus.NO_RESOLUTION) throw new ConflictException();
		if (supportUser && associatedPetition.campus !== supportUser.school.campus) throw new UnauthorizedException();
		
		const deadline = new Date(Date.now() + RESOLUTION_WINDOW);
		
		let newResolution = new Resolution();
		newResolution.deadline = deadline;
		newResolution.petition = associatedPetition;
		newResolution = await this.resolutionsRepository.save(newResolution);
		
		if (!supportUser)
		{
			await this.notificationsService.triggerNotifications(newResolution);
		}
		this.schedulingService.scheduleResolutionDeadline(newResolution);
		
		return newResolution;
	}
	
	
	async voteResolution(resolutionId: number, user: StudentUser): Promise<void>
	{
		const resolution = await this.resolutionsRepository.findOne(resolutionId, { relations: ['petition'] });
		if (!resolution) throw new NotFoundException();
		if (this.resolutionsRepository.getResolutionStatus(resolution) !== ResolutionStatus.TERMINATED) throw new UnauthorizedException();
		
		const didUserVote = await this.resolutionsRepository.didUserVote(resolutionId, user.id);
		if (didUserVote) throw new ConflictException();
		
		await this.resolutionsRepository.voteResolution(resolutionId, user.id);
		
		if (await this.resolutionsRepository.countNumberOfRejectionVotes(resolutionId) >= MIN_VOTES)
		{
			await this.returnToProgress(resolution);
		}
	}
	
	async returnToProgress(resolution: Resolution): Promise<void>
	{
		await this.resolutionsRepository.deleteRejectionVotes(resolution.id);
		
		const deadline = new Date(Date.now() + RESOLUTION_WINDOW);
		resolution.resolutionDate = null;
		resolution.deadline = deadline;
		resolution = await this.resolutionsRepository.save(resolution);
		
		this.schedulingService.scheduleResolutionDeadline(resolution);
		await this.notificationsService.triggerNotifications(resolution);
	}
	
	// CRUD
	
	async getResolutionInfo(resolution: Resolution): Promise<ResolutionInfo>
	{
		const resolutionInfo: ResolutionInfo = {
			id: resolution.id,
			petitionId: resolution.petition.id,
			title: resolution.petition.title,
			status: this.resolutionsRepository.getResolutionStatus(resolution),
			resolutionText: resolution.resolutionText,
		};
		
		if (resolutionInfo.status === ResolutionStatus.TERMINATED)
		{
			resolutionInfo.numRejectionVotes = await this.resolutionsRepository.countNumberOfRejectionVotes(resolution.id);
			resolutionInfo.resolutionDate = resolution.resolutionDate;
			resolutionInfo.numComments = await this.commentsRepository.countNumberOfComments(resolution.id, ResolutionComment);
		}
		else
		{
			resolutionInfo.startDate = resolution.startDate;
			resolutionInfo.deadline = resolution.deadline;
		}
		
		return resolutionInfo;
	}
	
	async addAuthInfo(info: ResolutionInfo, user: User): Promise<ResolutionInfo>
	{
		if (info.status === ResolutionStatus.TERMINATED)
		{
			info.didVote = await this.resolutionsRepository.didUserVote(info.id, user.id);
		}
		info.didSave = await this.resolutionsRepository.didUserSave(info.id, user.id);
		return info;
	}
}