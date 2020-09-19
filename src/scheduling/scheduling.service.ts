import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ResolutionsService } from 'src/resolutions/resolutions.service';


@Injectable()
export class SchedulingService
{    
    constructor(private scheduler: SchedulerRegistry,
                @Inject(forwardRef(() => ResolutionsService))
                private resolutionsService: ResolutionsService
                ) {}
    
    scheduleResolutionDeadline(resolutionId: number, petitionId: number, deadline: Date): void
    {
        const handler = async () => await this.resolutionsService.changeResolutionStatusToOverdue(resolutionId, petitionId);
        const job = new CronJob(deadline, handler);

        this.scheduler.addCronJob(resolutionId.toString(), job);
        job.start();
    }

    cancelResolutionDeadline(resolutionId: number): void
    {
        this.scheduler.deleteCronJob(resolutionId.toString());
    }
}
