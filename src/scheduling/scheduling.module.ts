import { forwardRef, Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { ResolutionsModule } from 'src/resolutions/resolutions.module';

@Module({
    imports: [forwardRef(() => ResolutionsModule)],
    providers: [SchedulingService],
    exports: [SchedulingService]
})
export class SchedulingModule {}
