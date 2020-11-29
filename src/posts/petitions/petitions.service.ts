import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StudentUser, User } from 'src/users/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { PetitionsRepository } from './petitions.repository';
import { Petition } from 'src/posts/petitions/petition.entity';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { ResolutionsService } from 'src/posts/resolutions/resolutions.service';
import { PostsService } from '../posts.service';
import { PetitionCommentsService } from './comments/petition-comments.service';
import { MIN_PETITION_VOTES } from '../../util/constants';
import { PetitionInfo } from './interfaces/petition-info.interface';
import { PetitionStatus } from './enums/petition-status.enum';
import { Page } from '../../util/page/page.interface';

@Injectable()
export class PetitionsService extends PostsService<Petition, PetitionInfo, PetitionQueryParams>
{
    constructor(
        private readonly petitionsRepository: PetitionsRepository,
        private readonly resolutionsService: ResolutionsService,
        private readonly commentsService: PetitionCommentsService,
    )
    {
        super();
    }
    
    get repository(): PetitionsRepository
    {
        return this.petitionsRepository;
    }
    
    async findOne(id: number): Promise<Petition>
    {
        return await this.repository.findOne(id);
    }
    
    propertyRemover(info: PetitionInfo): void
    {
        info.description = undefined;
    }
    
    async getSavedInfoPage(user: User, pageNumber: number): Promise<Page<PetitionInfo>>
    {
        const page = await this.petitionsRepository.getSavedPage(user.id, pageNumber);
        return await this.pageToInfoPage(page, user);
    }
    
    async create(user: StudentUser, createPetitionDto: CreatePetitionDto): Promise<number>
    {
        const { title, description } = createPetitionDto;
        
        const newPetition = new Petition();
        newPetition.campus = user.school.campus;
        newPetition.title = title;
        newPetition.description = description;
        newPetition.by = user;
        
        const { id } = await this.petitionsRepository.save(newPetition);
        
        return id;
    }
    
    async triggerVoteLimitAction(petition: Petition): Promise<void>
    {
        if (await this.petitionsRepository.countVotes(petition.id) >= MIN_PETITION_VOTES)
        {
            await this.resolutionsService.createAssociatedByPetitionId(petition.id);
        }
    }
    
    async deleteById(petitionId: number, user: StudentUser): Promise<void>
    {
        await this.checkMutationValidity(petitionId, user.id);
        await this.petitionsRepository.deleteWithRelations(petitionId);
    }
    
    async updateById(petitionId: number, user: StudentUser, createPetitionDto: CreatePetitionDto): Promise<void>
    {
        const petition = await this.checkMutationValidity(petitionId, user.id);
        await this.petitionsRepository.updatePetition(petition, createPetitionDto);
    }
    
    async getInfo(petition: Petition): Promise<PetitionInfo>
    {
        const numVotes = await this.petitionsRepository.countVotes(petition.id);
        const numComments = await this.commentsService.countPostComments(petition.id);
        const status = await this.petitionsRepository.getStatus(petition.id);
    
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
            let petitionCopy = petition;
            if (!petition.resolution)
            {
                petitionCopy = await this.petitionsRepository.findOne(petition.id, { relations: ['resolution'] });
            }
            info.resolutionId = petitionCopy.resolution.id;
        }
        return info;
    }
    
    private async checkMutationValidity(petitionId: number, userId: number): Promise<Petition>
    {
        const petition = await this.petitionsRepository.findOne(petitionId, { relations: ['resolution', 'by'] });
        
        if (!petition) throw new NotFoundException();
        if (petition.by.id !== userId) throw new UnauthorizedException();
        if (petition.resolution || await this.petitionsRepository.countVotes(petitionId) >
            0) throw new ConflictException();
        
        return petition;
    }
}
