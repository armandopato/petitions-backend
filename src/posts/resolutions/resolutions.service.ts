import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { SupportTeamUser } from 'src/users/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PetitionsRepository } from 'src/posts/petitions/petitions.repository';
import { SchedulingService } from 'src/scheduling/scheduling.service';
import { PostTerminatedResolutionDto } from './dto/post-terminated-resolution.dto';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionsRepository } from './resolutions.repository';
import { PostsService } from '../posts.service';
import { ResolutionCommentsService } from './comments/resolution-comments.service';
import { MIN_RESOLUTION_VOTES, RESOLUTION_WINDOW_MILLISECONDS } from '../../util/constants';
import { ResolutionInfo } from './interfaces/resolution-info.interface';
import { PetitionStatus } from '../petitions/enums/petition-status.enum';
import { ResolutionStatus } from './enums/resolution-status.enum';


@Injectable()
export class ResolutionsService extends PostsService<Resolution, ResolutionInfo, ResolutionQueryParams>
{
	constructor(private resolutionsRepository: ResolutionsRepository,
	            private commentsService: ResolutionCommentsService,
	            private petitionsRepository: PetitionsRepository,
	            private schedulingService: SchedulingService,
	            private notificationsService: NotificationsService)
	{
		super();
	}
	
	get repository(): ResolutionsRepository
	{
		return this.resolutionsRepository;
	}
	
	async loadOne(id: number): Promise<Resolution>
	{
		return await this.repository.findOne(id, { relations: ['petition'] });
	}
	
	propertyRemover(info: ResolutionInfo): void
	{
		info.resolutionText = undefined;
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
		
		const deadline = new Date(Date.now() + RESOLUTION_WINDOW_MILLISECONDS);
		
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
	
	isVoteInfoAvailable(info: ResolutionInfo): boolean
	{
		return info.status === ResolutionStatus.TERMINATED;
	}
	
	checkVoteConstraint(resolution: Resolution): void
	{
		if (this.resolutionsRepository.getResolutionStatus(resolution) !== ResolutionStatus.TERMINATED) throw new ForbiddenException();
	}
	
	async triggerVoteLimitAction(resolution: Resolution): Promise<void>
	{
		if (await this.resolutionsRepository.countNumberOfRejectionVotes(resolution.id) >= MIN_RESOLUTION_VOTES)
		{
			await this.returnToProgress(resolution);
		}
	}
	
	async returnToProgress(resolution: Resolution): Promise<void>
	{
		await this.resolutionsRepository.deleteRejectionVotes(resolution.id);
		
		const deadline = new Date(Date.now() + RESOLUTION_WINDOW_MILLISECONDS);
		resolution.resolutionDate = null;
		resolution.deadline = deadline;
		resolution = await this.resolutionsRepository.save(resolution);
		
		this.schedulingService.scheduleResolutionDeadline(resolution);
		await this.notificationsService.triggerNotifications(resolution);
	}
	
	async getInfo(resolution: Resolution): Promise<ResolutionInfo>
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
			resolutionInfo.numComments = await this.commentsService.countNumberOfComments(resolution.id);
		}
		else
		{
			resolutionInfo.startDate = resolution.startDate;
			resolutionInfo.deadline = resolution.deadline;
		}
		
		return resolutionInfo;
	}
}
