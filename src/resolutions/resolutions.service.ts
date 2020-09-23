import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Resolution } from 'src/entities/resolution.entity';
import { SupportTeamUser, User } from 'src/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PetitionRepository } from 'src/petitions/petitions.repository';
import { SchedulingService } from 'src/scheduling/scheduling.service';
import { ResolutionInfo } from 'src/types/ElementInfo';
import { PetitionStatus, ResolutionStatus } from 'src/types/ElementStatus';
import { Page } from 'src/types/Page';
import { PostTerminatedResolutionDto } from './dto/post-terminated-resolution.dto';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionRepository } from './resolutions.repository';

const DAY = 1000 * 60 * 60 * 24;
const RESOLUTION_WINDOW = DAY * 30;

@Injectable()
export class ResolutionsService
{
	constructor(private resolutionsRepository: ResolutionRepository,
	            private petitionsRepository: PetitionRepository,
	            private schedulingService: SchedulingService,
	            private notificationsService: NotificationsService)
	{
	}
	
	async getResolutionsPageBySchool(params: ResolutionQueryParams, user: User): Promise<Page<ResolutionInfo>>
	{
		const { pageElements: resolutions, totalPages } = await this.resolutionsRepository.getResolutionsPage(params);
		let resolutionInfoArr: ResolutionInfo[];
		
		if (user)
		{
			resolutionInfoArr = await this.resolutionsRepository.mapResolutionsToAuthResolutionsInfo(resolutions, user);
		} else
		{
			resolutionInfoArr = await this.resolutionsRepository.mapResolutionsToResolutionsInfo(resolutions);
		}
		
		return {
			pageElements: resolutionInfoArr,
			totalPages,
		};
	}
	
	async getResolutionInfoById(resolutionId: number, user: User): Promise<ResolutionInfo>
	{
		const resolution = await this.resolutionsRepository.findOne(resolutionId, { relations: ['petition'] });
		if (!resolution) throw new NotFoundException();
		
		if (user)
		{
			return await this.resolutionsRepository.getAuthResolutionInfoWResText(resolution, user);
		}
		
		return await this.resolutionsRepository.getResolutionInfoWResText(resolution);
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
		this.schedulingService.scheduleResolutionDeadline(newResolution, deadline);
		
		return newResolution;
	}
}
