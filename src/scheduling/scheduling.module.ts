import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SchedulingService } from './scheduling.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsRepository } from '../posts/resolutions/resolutions.repository';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [NotificationsModule, TypeOrmModule.forFeature([ResolutionsRepository]), ScheduleModule.forRoot()],
    providers: [SchedulingService],
    exports: [SchedulingService],
})
export class SchedulingModule
{
}
