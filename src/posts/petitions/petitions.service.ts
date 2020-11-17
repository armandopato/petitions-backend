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
    
    async loadOne(id: number): Promise<Petition>
    {
        return await this.repository.findOne(id);
    }
    
    propertyRemover(info: PetitionInfo): void
    {
        info.description = undefined;
    }
    
    async getSavedPetitions(user: User, pageNumber: number): Promise<Page<PetitionInfo>>
    {
        const page = await this.petitionsRepository.getSavedPetitionsPage(user.id, pageNumber);
        return await this.pageToInfoPage(page, user);
    }
    
    async postPetition(user: StudentUser, createPetitionDto: CreatePetitionDto): Promise<number>
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
        if (await this.petitionsRepository.countNumberOfVotes(petition.id) >= MIN_PETITION_VOTES)
        {
            await this.resolutionsService.createAssociatedResolution(petition.id);
        }
    }
    
    async deletePetition(petitionId: number, user: StudentUser): Promise<void>
    {
        await this.checkPetitionMutationValidity(petitionId, user.id);
        await this.petitionsRepository.deletePetitionAndSavedRelations(petitionId);
    }
    
    async editPetition(petitionId: number, user: StudentUser, editPetitionDto: CreatePetitionDto): Promise<void>
    {
        const petition = await this.checkPetitionMutationValidity(petitionId, user.id);
        await this.petitionsRepository.editPetition(petition, editPetitionDto);
    }
    
    async getInfo(petition: Petition): Promise<PetitionInfo>
    {
        const numVotes = await this.petitionsRepository.countNumberOfVotes(petition.id);
        const numComments = await this.commentsService.countNumberOfComments(petition.id);
        const status = await this.petitionsRepository.getPetitionStatus(petition.id);
        
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
    
    private async checkPetitionMutationValidity(petitionId: number, userId: number): Promise<Petition>
    {
        const petition = await this.petitionsRepository.findOne(petitionId, { relations: ['resolution', 'by'] });
        
        if (!petition) throw new NotFoundException();
        if (petition.by.id !== userId) throw new UnauthorizedException();
        if (petition.resolution || await this.petitionsRepository.countNumberOfVotes(petitionId) >
            0) throw new ConflictException();
        
        return petition;
    }
}
