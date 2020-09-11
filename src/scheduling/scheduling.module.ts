import { forwardRef, Module } from '@nestjs/common';
import { PetitionsModule } from 'src/petitions/petitions.module';
import { SchedulingService } from './scheduling.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [ScheduleModule, forwardRef(() => PetitionsModule)],
    providers: [SchedulingService],
    exports: [SchedulingService]
})
export class SchedulingModule {}
