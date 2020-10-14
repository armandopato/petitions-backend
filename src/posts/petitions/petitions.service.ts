import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StudentUser } from 'src/users/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { PetitionInfo } from 'src/posts/ElementInfo';
import { PetitionRepository } from './petitions.repository';
import { Petition } from 'src/posts/petitions/petition.entity';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { ResolutionsService } from 'src/posts/resolutions/resolutions.service';
import { PetitionStatus } from '../ElementStatus';
import { Post } from '../post.class';
import { PetitionCommentService } from './petition-comment/petition-comment.service';

const MIN_VOTES = 100;

@Injectable()
export class PetitionsService extends Post<Petition, PetitionInfo, PetitionQueryParams>
{
	constructor(
		private petitionRepository: PetitionRepository,
		private resolutionsService: ResolutionsService,
		private commentsService: PetitionCommentService,
	)
	{
		super();
	}
	
	get repository(): PetitionRepository
	{
		return this.petitionRepository;
	}
	
	async loadOne(id: number): Promise<Petition>
	{
		return await this.repository.findOne(id);
	}
	
	propertyRemover(info: PetitionInfo): void
	{
		info.description = undefined;
	}
	
	async postPetition(user: StudentUser, createPetitionDto: CreatePetitionDto): Promise<number>
	{
		const { title, description } = createPetitionDto;
		
		const newPetition = new Petition();
		newPetition.campus = user.school.campus;
		newPetition.title = title;
		newPetition.description = description;
		newPetition.by = user;
		
		const { id } = await this.petitionRepository.save(newPetition);
		
		return id;
	}
	
	async triggerVoteLimitAction(petition: Petition): Promise<void>
	{
		if (await this.petitionRepository.countNumberOfVotes(petition.id) >= MIN_VOTES)
		{
			await this.resolutionsService.createAssociatedResolution(petition.id);
		}
	}
	
	async deletePetition(petitionId: number, user: StudentUser): Promise<void>
	{
		await this.checkPetitionMutationValidity(petitionId, user.id);
		await this.petitionRepository.deletePetitionAndSavedRelations(petitionId);
	}
	
	async editPetition(petitionId: number, user: StudentUser, editPetitionDto: CreatePetitionDto): Promise<void>
	{
		const petition = await this.checkPetitionMutationValidity(petitionId, user.id);
		await this.petitionRepository.editPetition(petition, editPetitionDto);
	}
	
	async getInfo(petition: Petition): Promise<PetitionInfo>
	{
		const numVotes = await this.petitionRepository.countNumberOfVotes(petition.id);
		const numComments = await this.commentsService.countNumberOfComments(petition.id);
		const status = await this.petitionRepository.getPetitionStatus(petition.id);
		
		const info: PetitionInfo = {
			id: petition.id,
			title: petition.title,
			date: petition.createdDate,
			status: status,
			numVotes: numVotes,
			numComments: numComments,
			description: petition.description,
		};
		
		if (status !== PetitionStatus.NO_RESOLUTION)
		{
			if (!petition.resolution)
			{
				petition = await this.petitionRepository.findOne(petition.id, { relations: ['resolution'] });
			}
			info.resolutionId = petition.resolution.id;
		}
		return info;
	}
	
	private async checkPetitionMutationValidity(petitionId: number, userId: number): Promise<Petition>
	{
		const petition = await this.petitionRepository.findOne(petitionId, { relations: ['resolution', 'by'] });
		
		if (!petition) throw new NotFoundException();
		if (petition.by.id !== userId) throw new UnauthorizedException();
		if (petition.resolution || await this.petitionRepository.countNumberOfVotes(petitionId) > 0) throw new ConflictException();
		
		return petition;
	}
}
