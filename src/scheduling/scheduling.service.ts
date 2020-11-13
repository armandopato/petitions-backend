import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ResolutionsRepository } from '../posts/resolutions/resolutions.repository';
import { ResolutionStatus } from '../posts/resolutions/enums/resolution-status.enum';


@Injectable()
export class SchedulingService
{
	constructor(private readonly scheduler: SchedulerRegistry,
	            private readonly notificationsService: NotificationsService,
	            private readonly resolutionsRepository: ResolutionsRepository,
	)
	{
	}
	
	async initialResolutionDeadlineScheduling(): Promise<void>
	{
		const resolutions = await this.resolutionsRepository.find();
		resolutions.filter(resolution => this.resolutionsRepository.getResolutionStatus(resolution) === ResolutionStatus.IN_PROGRESS)
			.forEach(resolution => this.scheduleResolutionDeadline(resolution));
	}
	
	scheduleResolutionDeadline(resolution: Resolution): void
	{
		const handler = async () => await this.notificationsService.triggerNotifications(resolution);
		const job = new CronJob(resolution.deadline, handler);
		
		this.scheduler.addCronJob(resolution.id.toString(), job);
		job.start();
	}
	
	cancelResolutionDeadline(resolutionId: number): void
	{
		try
		{
			this.scheduler.deleteCronJob(resolutionId.toString());
		}
		catch (err)
		{
			console.log('No cron job was found for resolution ' + resolutionId);
		}
	}
}
