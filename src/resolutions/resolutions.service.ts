import { Injectable } from '@nestjs/common';
import { Resolution } from 'src/entities/resolution.entity';

@Injectable()
export class ResolutionsService
{
    async createResolution(petitionId: number): Promise<Resolution>
    {
        // add state change scheduling
        return;
    }

    async triggerNewResolutionNotifications(resolution: Resolution): Promise<void>
    {
        return;
    }
}
