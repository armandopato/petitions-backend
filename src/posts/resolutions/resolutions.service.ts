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
import { PetitionsRepository } from 'src/posts/petitions/petitions.repository';
import { SchedulingService } from 'src/scheduling/scheduling.service';
import { CreateTerminatedResolutionDto } from './dto/create-terminated-resolution.dto';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionsRepository } from './resolutions.repository';
import { PostsService } from '../posts.service';
import { ResolutionCommentsService } from './comments/resolution-comments.service';
import { MIN_RESOLUTION_VOTES, RESOLUTION_WINDOW_MILLISECONDS } from '../../util/constants';
import { ResolutionInfo } from './interfaces/resolution-info.interface';
import { PetitionStatus } from '../petitions/enums/petition-status.enum';
import { ResolutionStatus } from './enums/resolution-status.enum';
import { Page } from '../../util/page/page.interface';


@Injectable()
export class ResolutionsService extends PostsService<Resolution, ResolutionInfo, ResolutionQueryParams>
{
    constructor(private readonly resolutionsRepository: ResolutionsRepository,
                private readonly commentsService: ResolutionCommentsService,
                private readonly petitionsRepository: PetitionsRepository,
                private readonly schedulingService: SchedulingService,
                private readonly notificationsService: NotificationsService)
    {
        super();
    }
    
    get repository(): ResolutionsRepository
    {
        return this.resolutionsRepository;
    }
    
    async findOne(id: number): Promise<Resolution>
    {
        return await this.repository.findOne(id, { relations: ['petition'] });
    }
    
    propertyRemover(info: ResolutionInfo): void
    {
        info.resolutionText = undefined;
    }
    
    async getSavedInfoPage(user: User, pageNumber: number): Promise<Page<ResolutionInfo>>
    {
        const page = await this.resolutionsRepository.getSavedPage(user.id, pageNumber);
        return await this.pageToInfoPage(page, user);
    }
    
    async createTerminated(createTerminatedResolutionDto: CreateTerminatedResolutionDto,
                           supportUser: SupportTeamUser): Promise<number>
    {
        const { petitionId, resolutionText } = createTerminatedResolutionDto;
        const newResolution = await this.createAssociatedByPetitionId(petitionId, supportUser);
        
        await this.terminateById(newResolution, supportUser, resolutionText);
        return newResolution.id;
    }
    
    async terminateById(resolutionOrId: number | Resolution, supportUser: SupportTeamUser,
                        resolutionText: string): Promise<void>
    {
        const resolution = typeof resolutionOrId === 'number' ?
            await this.resolutionsRepository.findOne(resolutionOrId, { relations: ['petition'] }) :
            { ...resolutionOrId };
        
        if (!resolution) throw new NotFoundException();
        if (resolution.petition.campus !== supportUser.school.campus) throw new UnauthorizedException();
        if (this.resolutionsRepository.getStatus(resolution) ===
            ResolutionStatus.TERMINATED) throw new ConflictException();
        
        resolution.by = supportUser;
        resolution.resolutionText = resolutionText;
        resolution.resolutionDate = new Date(Date.now());
        
        await this.resolutionsRepository.save(resolution);
        this.schedulingService.cancelResolutionDeadline(resolution.id);
        await this.notificationsService.trigger(resolution);
    }
    
    async createAssociatedByPetitionId(petitionId: number, supportUser?: SupportTeamUser): Promise<Resolution>
    {
        const associatedPetition = await this.petitionsRepository.findOne(petitionId);
        if (!associatedPetition) throw new NotFoundException();
        if (await this.petitionsRepository.getStatus(petitionId) !==
            PetitionStatus.NO_RESOLUTION) throw new ConflictException();
        if (supportUser && associatedPetition.campus !== supportUser.school.campus) throw new UnauthorizedException();
        
        const deadline = new Date(Date.now() + RESOLUTION_WINDOW_MILLISECONDS);
        
        let newResolution = new Resolution();
        newResolution.deadline = deadline;
        newResolution.petition = associatedPetition;
        newResolution = await this.resolutionsRepository.save(newResolution);
        
        if (!supportUser)
        {
            await this.notificationsService.trigger(newResolution);
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
        if (this.resolutionsRepository.getStatus(resolution) !==
            ResolutionStatus.TERMINATED) throw new ForbiddenException();
    }
    
    async triggerVoteLimitAction(resolution: Resolution): Promise<void>
    {
        if (await this.resolutionsRepository.countVotes(resolution.id) >= MIN_RESOLUTION_VOTES)
        {
            await this.returnToProgress(resolution);
        }
    }
    
    async returnToProgress(resolution: Resolution): Promise<void>
    {
        let resolutionCopy = { ...resolution };
        await this.resolutionsRepository.deleteVotes(resolutionCopy.id);
        
        const deadline = new Date(Date.now() + RESOLUTION_WINDOW_MILLISECONDS);
        resolutionCopy.resolutionDate = null;
        resolutionCopy.deadline = deadline;
        resolutionCopy = await this.resolutionsRepository.save(resolutionCopy);
    
        this.schedulingService.scheduleResolutionDeadline(resolutionCopy);
        await this.notificationsService.trigger(resolutionCopy);
    }
    
    async getInfo(resolution: Resolution): Promise<ResolutionInfo>
    {
        const resolutionInfo: ResolutionInfo = {
            id: resolution.id,
            petitionId: resolution.petition.id,
            title: resolution.petition.title,
            status: this.resolutionsRepository.getStatus(resolution),
            resolutionText: resolution.resolutionText,
        };
        
        if (resolutionInfo.status === ResolutionStatus.TERMINATED)
        {
            resolutionInfo.numRejectionVotes =
                await this.resolutionsRepository.countVotes(resolution.id);
            resolutionInfo.resolutionDate = resolution.resolutionDate;
            resolutionInfo.numComments = await this.commentsService.countPostComments(resolution.id);
        }
        else
        {
            resolutionInfo.startDate = resolution.startDate;
            resolutionInfo.deadline = resolution.deadline;
        }
        
        return resolutionInfo;
    }
}
