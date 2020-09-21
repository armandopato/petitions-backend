import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Resolution } from 'src/entities/resolution.entity';
import { NotificationsService } from 'src/notifications/notifications.service';


@Injectable()
export class SchedulingService
{    
    constructor(private scheduler: SchedulerRegistry,
                private notificationsService: NotificationsService
                ) {}
    
    scheduleResolutionDeadline(resolution: Resolution, deadline: Date): void
    {
        const handler = async () => await this.notificationsService.triggerNotifications(resolution);
        const job = new CronJob(deadline, handler);

        this.scheduler.addCronJob(resolution.id.toString(), job);
        job.start();
    }

    cancelResolutionDeadline(resolutionId: number): void
    {
        this.scheduler.deleteCronJob(resolutionId.toString());
    }
}
