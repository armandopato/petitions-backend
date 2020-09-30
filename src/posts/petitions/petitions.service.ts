import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { StudentUser, User } from 'src/users/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { PetitionInfo } from 'src/types/ElementInfo';
import { PetitionRepository } from './petitions.repository';
import { Petition } from 'src/posts/petitions/petition.entity';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { ResolutionsService } from 'src/posts/resolutions/resolutions.service';
import { PetitionComment } from 'src/comments/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetitionStatus } from '../../types/ElementStatus';
import { CommentsRepository } from '../../comments/comments.repository';
import { Post } from '../../types/Post.interface';
import { Page } from '../../types/Page';
import { PostsService } from '../posts.service';
import * as _ from 'lodash';


const MIN_VOTES = 100;

@Injectable()
export class PetitionsService implements Post<Petition, PetitionInfo, PetitionQueryParams>
{
	infoMapper = this.getInfo.bind(this);
	
	getInfoById: (petitionId: number, user: User) => Promise<PetitionInfo>;
	getInfoPage: (params: PetitionQueryParams, user: User) => Promise<Page<PetitionInfo>>;
	saveOrUnsave: (petitionId: number, user: User) => Promise<void>;
	
	constructor(
		private petitionRepository: PetitionRepository,
		private resolutionsService: ResolutionsService,
		private commentsRepository: CommentsRepository,
		@InjectRepository(PetitionComment)
		private petitionCommentRepository: Repository<PetitionComment>,
		private postsService: PostsService,
	)
	{
		this.getInfoById = _.partial(this.postsService.getPostInfoById.bind(this.postsService), Petition) as any;
		this.getInfoPage = _.partial(this.postsService.getPostsInfoPage.bind(this.postsService), Petition) as any;
		this.saveOrUnsave = _.partial(this.postsService.saveOrUnsavePost.bind(this.postsService), Petition);
	}
	
	get repository(): PetitionRepository
	{
		return this.petitionRepository;
	}
	
	propertyRemover(info: PetitionInfo): void
	{
		info.description = undefined;
	}
	
	authInfoMapperGenerator = (user: User) => (info: PetitionInfo): Promise<PetitionInfo> => this.addAuthInfo(info, user);
	
	
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
	
	async votePetition(petitionId: number, user: StudentUser): Promise<void>
	{
		const didUserVote = await this.petitionRepository.didUserVote(petitionId, user.id);
		if (didUserVote) throw new ConflictException();
		
		try
		{
			await this.petitionRepository.votePetition(petitionId, user.id);
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
		if (await this.petitionRepository.countNumberOfVotes(petitionId) >= MIN_VOTES)
		{
			await this.resolutionsService.createAssociatedResolution(petitionId);
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
		const numComments = await this.commentsRepository.countNumberOfComments(petition.id, PetitionComment);
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
	
	
	// CRUD
	
	async addAuthInfo(info: PetitionInfo, user: User): Promise<PetitionInfo>
	{
		info.didSave = await this.petitionRepository.didUserSave(info.id, user.id);
		info.didVote = await this.petitionRepository.didUserVote(info.id, user.id);
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
