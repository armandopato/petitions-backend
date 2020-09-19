import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Resolution } from 'src/entities/resolution.entity';
import { SupportTeamUser, User } from 'src/entities/user.entity';
import { PetitionRepository } from 'src/petitions/petitions.repository';
import { SchedulingService } from 'src/scheduling/scheduling.service';
import { ResolutionInfo } from 'src/types/ElementInfo';
import { PetitionStatus, ResolutionStatus } from 'src/types/ElementStatus';
import { Page } from 'src/types/Page';
import { PostTerminatedResolutionDto } from './dto/post-terminated-resolution.dto';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionRepository } from './resolutions.repository';

const DAY = 1000*60*60*24;
const RESOLUTION_WINDOW = DAY*30;

@Injectable()
export class ResolutionsService
{
    constructor(private resolutionsRepository: ResolutionRepository,
                private petitionsRepository: PetitionRepository,
                private schedulingService: SchedulingService) {}

    async getResolutionsPageBySchool(params: ResolutionQueryParams, user: User): Promise<Page<ResolutionInfo>>
    {
        const { pageElements: resolutions, totalPages } = await this.resolutionsRepository.getResolutionsPage(params);
        let resolutionInfoArr: ResolutionInfo[] = [];

        if (user)
        {
            resolutionInfoArr = await this.resolutionsRepository.mapResolutionsToAuthResolutionsInfo(resolutions, user);
        }
        else
        {
            resolutionInfoArr = await this.resolutionsRepository.mapResolutionsToResolutionsInfo(resolutions);
        }

        return {
            pageElements: resolutionInfoArr,
            totalPages
        };
    }

    async resolvePetition(postTerminatedResolutionDto: PostTerminatedResolutionDto, supportUser: SupportTeamUser): Promise<number>
    {
        const { petitionId, resolutionText } = postTerminatedResolutionDto;
        const newResolution = await this.createAssociatedResolution(petitionId);

        await this.terminateResolution(newResolution, supportUser, resolutionText);
        return newResolution.id;
    }

    async changeResolutionStatusToOverdue(resolutionId: number, petitionId: number): Promise<void>
    {
        await this.resolutionsRepository.update(resolutionId, { status: ResolutionStatus.OVERDUE });
        await this.petitionsRepository.update(petitionId, { status: PetitionStatus.OVERDUE });
    }

    async terminateResolution(resolutionOrId: number | Resolution, supportUser: SupportTeamUser, resolutionText: string): Promise<void>
    {
        const resolution = typeof resolutionOrId === 'number' ? await this.resolutionsRepository.findOne(resolutionOrId, { relations: ['petition'] }) : resolutionOrId;

        this.schedulingService.cancelResolutionDeadline(resolution.id);
        if (resolution.campus !== supportUser.school.campus) throw new UnauthorizedException();
        resolution.status = ResolutionStatus.TERMINATED;
        resolution.by = supportUser;
        resolution.resolutionText = resolutionText;
        resolution.resolutionDate = new Date(Date.now());

        await this.petitionsRepository.update(resolution.petition.id, { status: PetitionStatus.TERMINATED });
        await this.resolutionsRepository.save(resolution);
    }

    async createAssociatedResolution(petitionId: number, supportUser?: SupportTeamUser): Promise<Resolution>
    {
        const associatedPetition = await this.petitionsRepository.findOne(petitionId);
        if (!associatedPetition) throw new NotFoundException();
        if (associatedPetition.status === PetitionStatus.TERMINATED) throw new ConflictException();
        if (supportUser && associatedPetition.campus !== supportUser.school.campus) throw new UnauthorizedException();

        const deadline = new Date(Date.now() + RESOLUTION_WINDOW);

        let newResolution = new Resolution();
        newResolution.deadline = deadline;
        newResolution.campus = associatedPetition.campus;
        newResolution.petition = associatedPetition;
        newResolution.status = ResolutionStatus.IN_PROGRESS;
        newResolution = await this.resolutionsRepository.save(newResolution);

        this.schedulingService.scheduleResolutionDeadline(newResolution.id, petitionId, deadline);
        await this.petitionsRepository.update(petitionId, { status: PetitionStatus.IN_PROGRESS });

        return newResolution;
    }

    async triggerNewResolutionNotifications(resolution: Resolution): Promise<void>
    {
        return;
    }
}
