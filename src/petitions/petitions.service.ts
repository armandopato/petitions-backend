import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StudentUser, User } from 'src/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { PetitionInfo } from 'src/types/ElementInfo';
import { PetitionRepository } from './petitions.repository';
import { Petition } from 'src/entities/petition.entity';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { ResolutionsService } from 'src/resolutions/resolutions.service';
import { PetitionComment } from 'src/entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetitionStatus } from '../types/ElementStatus';
import { CommentsRepository } from '../comments/comments.repository';


const MIN_VOTES = 100;

@Injectable()
export class PetitionsService
{
    constructor(
                private petitionRepository: PetitionRepository,
                private resolutionsService: ResolutionsService,
                private commentsRepository: CommentsRepository,
                @InjectRepository(PetitionComment)
                private petitionCommentRepository: Repository<PetitionComment>
                ) {}

    async getPetitionsPageBySchool(params: PetitionQueryParams, user: User): Promise<Page<PetitionInfo>>
    {
        const { pageElements: petitions, totalPages } = await this.petitionRepository.getPetitionsPage(params);
        let petitionInfoArr: PetitionInfo[];

        if (user)
        {
            petitionInfoArr = await this.mapPetitionsToAuthPetitionsInfo(petitions, user);
        }
        else
        {
            petitionInfoArr = await this.mapPetitionsToPetitionsInfo(petitions);
        }

        return {
            pageElements: petitionInfoArr,
            totalPages
        };
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


    async getPetitionInfoById(petitionId: number, user: User): Promise<PetitionInfo>
    {
        const petition = await this.petitionRepository.findOne(petitionId);
        if (!petition) throw new NotFoundException();

        if (user)
        {
            return await this.getAuthPetitionInfoWDesc(petition, user);
        }
        
        return await this.getPetitionInfoWDesc(petition);
    }


    async votePetition(petitionId: number, user: StudentUser): Promise<void>
    {
        const didUserVote = await this.petitionRepository.didUserVote(petitionId, user.id);
        if (didUserVote) throw new ConflictException();

        try
        {
            await this.petitionRepository.votePetition(petitionId, user.id);
        }
        catch(err)
        {
            if (Number(err.code) === 23503) throw new NotFoundException();
            else throw new InternalServerErrorException();
        }
        if (await this.petitionRepository.countNumberOfVotes(petitionId) >= MIN_VOTES)
        {
            await this.resolutionsService.createAssociatedResolution(petitionId);
        }
    }


    async saveOrUnsavePetition(petitionId: number, user: User): Promise<void>
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
        catch(err)
        {
            if (Number(err.code) === 23503) throw new NotFoundException();
            else throw new InternalServerErrorException();
        }
    }
    
    private async checkPetitionMutationValidity(petitionId: number, userId: number): Promise<Petition>
    {
        const petition = await this.petitionRepository.findOne(petitionId, { relations: ["resolution", "by"] });

        if (!petition) throw new NotFoundException();
        if (petition.by.id !== userId) throw new UnauthorizedException();
        if (petition.resolution || await this.petitionRepository.countNumberOfVotes(petitionId) > 0) throw new ConflictException();

        return petition;
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
    
    
    
    // CRUD
    
    async getPetitionInfo(petition: Petition): Promise<PetitionInfo>
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
    
    async getAuthPetitionInfo(petition: Petition, user: User): Promise<PetitionInfo>
    {
        const petitionInfo = await this.getPetitionInfo(petition);
        petitionInfo.didSave = await this.petitionRepository.didUserSave(petition.id, user.id);
        petitionInfo.didVote = await this.petitionRepository.didUserVote(petition.id, user.id);
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
}
