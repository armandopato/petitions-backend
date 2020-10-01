import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionRepository } from './petitions.repository';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';
import { ResolutionsModule } from 'src/posts/resolutions/resolutions.module';
import { PetitionComment } from 'src/comments/comment.entity';
import { CommentsModule } from '../../comments/comments.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([PetitionRepository, PetitionComment]),
		ResolutionsModule,
		CommentsModule,
	],
	controllers: [PetitionsController],
	providers: [PetitionsService],
	exports: [PetitionsService],
})
export class PetitionsModule
{
}
