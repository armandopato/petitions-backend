import { EntityRepository, getConnection, Repository } from 'typeorm';
import { Petition } from 'src/entities/petition.entity';
import { StudentUser, User } from 'src/entities/user.entity';
import { PetitionComment } from 'src/entities/comment.entity';
import { Page } from 'src/types/Page';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { getPage } from 'src/util/getPage';
import { PetitionOrderBy as OrderBy } from 'src/types/OrderBy';
import { PetitionInfo } from 'src/types/ElementInfo';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { Injectable } from '@nestjs/common';
import { Resolution } from 'src/entities/resolution.entity';
import { PetitionStatus } from 'src/types/ElementStatus';
import { CommentsRepository } from '../comments/comments.repository';


@EntityRepository(Petition)
@Injectable()
export class PetitionRepository extends Repository<Petition>
{
	private connection = getConnection();
	
	constructor(private commentsRepository: CommentsRepository)
	{
		super();
	}
	
	async getPetitionsPage(params: PetitionQueryParams): Promise<Page<Petition>>
	{
		const { page, orderBy, year, school, show, search } = params;
		const query = this.connection.createQueryBuilder(Petition, 'petition')
			.where('petition.campus = :school', { school })
			.andWhere('date_part(\'year\', petition.createdDate) = :year', { year });
		
		if (show)
		{
			switch (show)
			{
				case PetitionStatus.NO_RESOLUTION:
					query.leftJoin('petition.resolution', 'res')
						.andWhere('res.id IS NULL');
					break;
				
				case PetitionStatus.IN_PROGRESS:
					query.innerJoin('petition.resolution', 'res')
						.andWhere('res.resolutionDate IS NULL')
						.andWhere('res.deadline >= NOW()');
					break;
				
				case PetitionStatus.OVERDUE:
					query.innerJoin('petition.resolution', 'res')
						.andWhere('res.resolutionDate IS NULL')
						.andWhere('res.deadline < NOW()');
					break;
				
				case PetitionStatus.TERMINATED:
					query.innerJoin('petition.resolution', 'res')
						.andWhere('NOT res.resolutionDate IS NULL');
					break;
			}
		}
		
		if (search)
		{
			query.andWhere('petition.title LIKE :search', { search: `%${search}%` });
			query.andWhere('petition.description LIKE :search', { search: `%${search}%` });
		}
		
		switch (orderBy)
		{
			case OrderBy.MOST_RECENT:
				query.orderBy('petition.id', 'DESC');
				break;
			
			case OrderBy.OLDEST:
				query.orderBy('petition.id', 'ASC');
				break;
			
			case OrderBy.NUMBER_OF_VOTES:
				query.leftJoin('petition_voted_by_user', 'vote', 'vote.petitionId = petition.id')
					.addSelect('COUNT(vote.petitionId)', 'votesperpetition')
					.groupBy('petition.id')
					.orderBy('votesperpetition', 'DESC')
					.addOrderBy('petition.id', 'DESC');
				break;
			
			case OrderBy.RELEVANCE:
				if (!show)
				{
					query.leftJoin('petition.resolution', 'res')
						.addSelect('CASE WHEN res.resolutionDate IS NULL AND res.deadline < NOW() THEN 1 ELSE 2 END', 'relevance')
						.orderBy('relevance', 'ASC');
				}
				query.addOrderBy('petition.id', 'DESC');
				break;
		}
		
		return await getPage(query, page);
	}
	
	async countNumberOfVotes(id: number): Promise<number>
	{
		return await this.connection.createQueryBuilder(StudentUser, 'user')
			.innerJoinAndSelect('user.votedPetitions', 'petition')
			.where('petition.id = :id', { id: id })
			.getCount();
	}
	
	async didUserVote(id: number, userId: number): Promise<boolean>
	{
		const vote = await this.connection.createQueryBuilder(StudentUser, 'user')
			.innerJoinAndSelect('user.votedPetitions', 'petition')
			.where('user.id = :userId', { userId: userId })
			.andWhere('petition.id = :id', { id: id })
			.getCount();
		return vote === 1;
	}
	
	async didUserSave(id: number, userId: number): Promise<boolean>
	{
		const saved = await this.connection.createQueryBuilder(User, 'user')
			.innerJoinAndSelect('user.savedPetitions', 'petition')
			.where('user.id = :userId', { userId: userId })
			.andWhere('petition.id = :id', { id: id })
			.getCount();
		return saved === 1;
	}
	
	async getPetitionInfo(petition: Petition): Promise<PetitionInfo>
	{
		const numVotes = await this.countNumberOfVotes(petition.id);
		const numComments = await this.commentsRepository.countNumberOfComments(petition.id, PetitionComment);
		const status = await this.getPetitionStatus(petition.id);
		
		const info: PetitionInfo = {
			id: petition.id,
			title: petition.title,
			date: petition.createdDate,
			status: status,
			numVotes: numVotes,
			numComments: numComments,
		};
		
		if (status !== PetitionStatus.NO_RESOLUTION)
		{
			if (!petition.resolution)
			{
				petition = await this.findOne(petition.id, { relations: ['resolution'] });
			}
			info.resolutionId = petition.resolution.id;
		}
		return info;
	}
	
	async getAuthPetitionInfo(petition: Petition, user: User): Promise<PetitionInfo>
	{
		const petitionInfo = await this.getPetitionInfo(petition);
		petitionInfo.didSave = await this.didUserSave(petition.id, user.id);
		petitionInfo.didVote = await this.didUserVote(petition.id, user.id);
		return petitionInfo;
	}
	
	async getPetitionInfoWDesc(petition: Petition): Promise<PetitionInfo>
	{
		const petitionInfo = await this.getPetitionInfo(petition);
		petitionInfo.description = petition.description;
		return petitionInfo;
	}
	
	async getAuthPetitionInfoWDesc(petition: Petition, user: User): Promise<PetitionInfo>
	{
		const petitionInfo = await this.getAuthPetitionInfo(petition, user);
		petitionInfo.description = petition.description;
		return petitionInfo;
	}
	
	
	async mapPetitionsToPetitionsInfo(petitions: Petition[]): Promise<PetitionInfo[]>
	{
		const petitionsInfoArr: PetitionInfo[] = [];
		
		for (const petition of petitions)
		{
			const petitionInfo = await this.getPetitionInfo(petition);
			petitionsInfoArr.push(petitionInfo);
		}
		
		return petitionsInfoArr;
	}
	
	async mapPetitionsToAuthPetitionsInfo(petitions: Petition[], user: User): Promise<PetitionInfo[]>
	{
		const authPetitionsInfoArr: PetitionInfo[] = [];
		
		for (const petition of petitions)
		{
			const petitionInfo = await this.getAuthPetitionInfo(petition, user);
			authPetitionsInfoArr.push(petitionInfo);
		}
		
		return authPetitionsInfoArr;
	}
	
	
	async votePetition(petitionId: number, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(Petition, 'votedBy')
			.of(petitionId)
			.add(userId);
	}
	
	async savePetition(petitionId: number, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(Petition, 'savedBy')
			.of(petitionId)
			.add(userId);
	}
	
	async unsavePetition(petitionId: number, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(Petition, 'savedBy')
			.of(petitionId)
			.remove(userId);
	}
	
	async deletePetitionAndSavedRelations(petitionId: number): Promise<void>
	{
		await this.connection.createQueryBuilder().delete()
			.from('user_saved_petitions_petition')
			.where('petitionId = :petitionId', { petitionId: petitionId })
			.execute();
		
		await this.delete(petitionId);
	}
	
	async editPetition(petition: Petition, editPetitionDto: CreatePetitionDto): Promise<void>
	{
		petition.title = editPetitionDto.title;
		petition.description = editPetitionDto.description;
		
		await this.save(petition);
	}
	
	async getPetitionStatus(id: number): Promise<PetitionStatus>
	{
		const resolution = await this.connection.createQueryBuilder(Resolution, 'resolution')
			.innerJoin('resolution.petition', 'petition')
			.where('petition.id = :id', { id: id })
			.getOne();
		
		if (!resolution) return PetitionStatus.NO_RESOLUTION;
		
		else if (resolution.resolutionDate) return PetitionStatus.TERMINATED;
		
		else if (resolution.deadline >= new Date(Date.now())) return PetitionStatus.IN_PROGRESS;
		
		else return PetitionStatus.OVERDUE;
	}
}