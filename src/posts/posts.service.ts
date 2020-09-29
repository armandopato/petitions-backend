import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { PetitionQueryParams } from './petitions/dto/petition-query-params.dto';
import { StudentUser, User } from '../users/entities/user.entity';
import { Page } from '../types/Page';
import { PetitionInfo, ResolutionInfo } from '../types/ElementInfo';
import { CreatePetitionDto } from './petitions/dto/create-petition.dto';
import { Petition } from './petitions/petition.entity';
import { PetitionComment } from '../comments/comment.entity';
import { PetitionStatus } from '../types/ElementStatus';
import { ResolutionRepository } from './resolutions/resolutions.repository';
import { PetitionRepository } from './petitions/petitions.repository';
import { Resolution } from './resolutions/resolution.entity';

type PetitionOrResolution = Petition | Resolution;
type PetitionOrResolutionInfo = PetitionInfo | ResolutionInfo;

@Injectable()
export class PostsService
{
	async getPostsInfoPage<T, TInfo>(page: Page<T>,
	                              infoMapper: (post: T) => Promise<TInfo>,
	                              propertyRemover: (info: TInfo) => void,
	                              authInfoMapper?: (info: TInfo) => Promise<TInfo>,
	): Promise<Page<TInfo>>
	{
		const posts = page.pageElements;
		
		let postInfoArr = await Promise.all(posts.map(infoMapper));
		postInfoArr.forEach(propertyRemover);
		
		if (authInfoMapper)
		{
			postInfoArr = await Promise.all(postInfoArr.map(authInfoMapper));
		}
		
		return {
			pageElements: postInfoArr,
			totalPages: page.totalPages
		};
	}
	
	/*async getPostInfoById(petitionId: number, user: User): Promise<PetitionInfo>
	{
		const petition = await this.petitionRepository.findOne(petitionId);
		if (!petition) throw new NotFoundException();
		
		if (user)
		{
			return await this.getAuthPetitionInfoWDesc(petition, user);
		}
		
		return await this.getPetitionInfoWDesc(petition);
	}
	
	async saveOrUnsavePost(petitionId: number, user: User): Promise<void>
	{
		const didUserSave = await this.petitionRepository.didUserSave(petitionId, user.id);
		
		try
		{
			if (didUserSave)
			{
				await this.petitionRepository.unsavePetition(petitionId, user.id);
			}
			else
			{
				await this.petitionRepository.savePetition(petitionId, user.id);
			}
		}
		catch (err)
		{
			if (Number(err.code) === 23503) throw new NotFoundException();
			else throw new InternalServerErrorException();
		}
	}
	
	// very generic
	async votePost(petitionId: number, user: StudentUser): Promise<void>
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
	}*/
	
}
