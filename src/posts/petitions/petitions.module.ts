import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionRepository } from './petitions.repository';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';
import { ResolutionsModule } from 'src/posts/resolutions/resolutions.module';
import { PetitionCommentService } from './petition-comment/petition-comment.service';
import { PetitionCommentRepository } from './petition-comment/petition-comment.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([PetitionRepository, PetitionCommentRepository]),
		ResolutionsModule
	],
	controllers: [PetitionsController],
	providers: [PetitionsService, PetitionCommentService],
	exports: [PetitionsService],
})
export class PetitionsModule
{
}
