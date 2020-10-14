import { EntityRepository, getConnection, Repository } from 'typeorm';
import { Petition } from 'src/posts/petitions/petition.entity';
import { StudentUser, User } from 'src/users/entities/user.entity';
import { Page } from 'src/util/Page';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { getPage } from 'src/util/getPage';
import { PetitionOrderBy as OrderBy } from 'src/util/OrderBy';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { PetitionStatus } from 'src/posts/ElementStatus';
import { PageRepository } from '../../util/PageRepository';


@EntityRepository(Petition)
export class PetitionsRepository extends Repository<Petition> implements PageRepository<Petition, PetitionQueryParams>
{
	private connection = getConnection();
	
	async getPage(params: PetitionQueryParams): Promise<Page<Petition>>
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
	
	
	async vote(petitionId: number, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(Petition, 'votedBy')
			.of(petitionId)
			.add(userId);
	}
	
	async savePost(petitionId: number, userId: number): Promise<void>
	{
		await this.connection.createQueryBuilder()
			.relation(Petition, 'savedBy')
			.of(petitionId)
			.add(userId);
	}
	
	async unsavePost(petitionId: number, userId: number): Promise<void>
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