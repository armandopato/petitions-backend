import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionsRepository } from './petitions.repository';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';
import { ResolutionsModule } from 'src/posts/resolutions/resolutions.module';
import { PetitionCommentsService } from './comments/petition-comments.service';
import { PetitionCommentsRepository } from './comments/petition-comments.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([PetitionsRepository, PetitionCommentsRepository]),
        ResolutionsModule,
    ],
    controllers: [PetitionsController],
    providers: [PetitionsService, PetitionCommentsService],
    exports: [PetitionsService],
})
export class PetitionsModule
{
}
