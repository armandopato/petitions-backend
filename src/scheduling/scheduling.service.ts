import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ResolutionsService } from 'src/resolutions/resolutions.service';
import { Resolution } from 'src/entities/resolution.entity';


@Injectable()
export class SchedulingService
{    
    constructor(private scheduler: SchedulerRegistry,
                @Inject(forwardRef(() => ResolutionsService))
                private resolutionsService: ResolutionsService
                ) {}
    
    scheduleResolutionDeadline(resolution: Resolution, deadline: Date): void
    {
        const handler = async () => await this.resolutionsService.triggerOverdueResolutionNotifications(resolution);
        const job = new CronJob(deadline, handler);

        this.scheduler.addCronJob(resolution.id.toString(), job);
        job.start();
    }

    cancelResolutionDeadline(resolutionId: number): void
    {
        this.scheduler.deleteCronJob(resolutionId.toString());
    }
}
