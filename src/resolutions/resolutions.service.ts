import { Injectable } from '@nestjs/common';
import { Resolution } from 'src/entities/resolution.entity';
import { User } from 'src/entities/user.entity';
import { PetitionRepository } from 'src/petitions/petitions.repository';
import { ResolutionInfo } from 'src/types/ElementInfo';
import { PetitionStatus } from 'src/types/ElementStatus';
import { Page } from 'src/types/Page';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionRepository } from './resolutions.repository';

@Injectable()
export class ResolutionsService
{
    constructor(private resolutionsRepository: ResolutionRepository,
                private petitionsRepository: PetitionRepository) {}

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

    async createResolution(petitionId: number): Promise<Resolution>
    {
        // add state change scheduling
        return;
    }

    async createAssociatedResolution(petitionId: number): Promise<Resolution>
    {
        const resolution = await this.createResolution(petitionId);
        await this.petitionsRepository.update(petitionId, { status: PetitionStatus.IN_PROGRESS });
        return resolution;
    }

    async triggerNewResolutionNotifications(resolution: Resolution): Promise<void>
    {
        return;
    }
}
