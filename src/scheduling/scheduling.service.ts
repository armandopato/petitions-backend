import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PetitionsService } from 'src/petitions/petitions.service';


@Injectable()
export class SchedulingService
{
    // pending: perform initial scheduling of all petitions etc
    //private resolutionsService: Resolution
    constructor(private scheduler: SchedulerRegistry,
                @Inject(forwardRef(() => PetitionsService))
                private petitionsService: PetitionsService
                ) {}
    
    schedulePetitionDeadline(petitionId: number, deadline: Date): void
    {
        const handler = async () => await this.petitionsService.createAssociatedResolution(petitionId);
        const job = new CronJob(deadline, handler);
        const jobName = `petition${petitionId}`;

        this.scheduler.addCronJob(jobName, job);
        job.start();
    }
}
