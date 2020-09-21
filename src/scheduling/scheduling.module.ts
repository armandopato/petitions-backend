import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SchedulingService } from './scheduling.service';

@Module({
    imports: [NotificationsModule],
    providers: [SchedulingService],
    exports: [SchedulingService]
})
export class SchedulingModule {}
