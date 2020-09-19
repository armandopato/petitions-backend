import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionRepository } from './petitions.repository';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';
import { ResolutionsModule } from 'src/resolutions/resolutions.module';
import { PetitionComment } from 'src/entities/comment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PetitionRepository, PetitionComment]),
        ResolutionsModule
    ],
    controllers: [PetitionsController],
    providers: [PetitionsService],
    exports: [PetitionsService]
})
export class PetitionsModule {}
