import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { SupportTeamUser, User } from 'src/users/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PetitionRepository } from 'src/posts/petitions/petitions.repository';
import { SchedulingService } from 'src/scheduling/scheduling.service';
import { ResolutionInfo } from 'src/types/ElementInfo';
import { PetitionStatus, ResolutionStatus } from 'src/types/ElementStatus';
import { PostTerminatedResolutionDto } from './dto/post-terminated-resolution.dto';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionRepository } from './resolutions.repository';
import { CommentsRepository } from '../../comments/comments.repository';
import { ResolutionComment } from '../../comments/comment.entity';
import { Post } from '../post.class';

const DAY = 1000 * 60 * 60 * 24;
const RESOLUTION_WINDOW = DAY * 30;
const MIN_VOTES = 50;

@Injectable()
export class ResolutionsService extends Post<Resolution, ResolutionInfo, ResolutionQueryParams>
{
	infoMapper = this.getInfo.bind(this);

	constructor(private resolutionsRepository: ResolutionRepository,
	            private commentsRepository: CommentsRepository,
	            private petitionsRepository: PetitionRepository,
	            private schedulingService: SchedulingService,
	            private notificationsService: NotificationsService)
	{
		super();
	}
	
	get repository(): ResolutionRepository
	{
		return this.resolutionsRepository;
	}
	
	authInfoMapperGenerator = (user: User) => (info: ResolutionInfo): Promise<ResolutionInfo> => this.addAuthInfo(info, user);
	
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
	
	checkVoteConstraint(resolution: Resolution): void
	{
		if (this.resolutionsRepository.getResolutionStatus(resolution) !== ResolutionStatus.TERMINATED) throw new ForbiddenException();
	}
	
	async triggerVoteLimitAction(resolution: Resolution): Promise<void>
	{
		if (await this.resolutionsRepository.countNumberOfRejectionVotes(resolution.id) >= MIN_VOTES)
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
			resolutionInfo.numComments = await this.commentsRepository.countNumberOfComments(resolution.id, ResolutionComment);
		}
		else
		{
			resolutionInfo.startDate = resolution.startDate;
			resolutionInfo.deadline = resolution.deadline;
		}
		
		return resolutionInfo;
	}
}
