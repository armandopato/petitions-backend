import { Module } from '@nestjs/common';
import { ResolutionRepository } from './resolutions.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsService } from './resolutions.service';
import { ResolutionsController } from './resolutions.controller';
import { PetitionRepository } from 'src/petitions/petitions.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([ResolutionRepository, PetitionRepository])
    ],
    providers: [ResolutionsService],
    exports: [ResolutionsService],
    controllers: [ResolutionsController]
})
export class ResolutionsModule {}
