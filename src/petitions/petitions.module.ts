import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionRepository } from './petitions.repository';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';
import { SchedulingModule } from 'src/scheduling/scheduling.module';
import { ResolutionsModule } from 'src/resolutions/resolutions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PetitionRepository]),
        forwardRef(() => SchedulingModule),
        ResolutionsModule
    ],
    controllers: [PetitionsController],
    providers: [PetitionsService],
    exports: [PetitionsService]
})
export class PetitionsModule {}
