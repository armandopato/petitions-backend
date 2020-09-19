import { forwardRef, Module } from '@nestjs/common';
import { ResolutionRepository } from './resolutions.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsService } from './resolutions.service';
import { ResolutionsController } from './resolutions.controller';
import { PetitionRepository } from 'src/petitions/petitions.repository';
import { SchedulingModule } from 'src/scheduling/scheduling.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ResolutionRepository, PetitionRepository]),
        forwardRef(() => SchedulingModule)
    ],
    providers: [ResolutionsService],
    exports: [ResolutionsService],
    controllers: [ResolutionsController]
})
export class ResolutionsModule {}
