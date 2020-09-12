import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StudentUser, User } from 'src/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { PetitionInfo } from 'src/types/ElementInfo';
import { PetitionRepository } from './petitions.repository';
import { Petition } from 'src/entities/petition.entity';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { PetitionStatus } from 'src/types/ElementStatus';
import { SchedulingService } from 'src/scheduling/scheduling.service';
import { ResolutionsService } from 'src/resolutions/resolutions.service';
import { Resolution } from 'src/entities/resolution.entity';

const DAY = 1000*60*60*24;
const RESOLUTION_WINDOW = DAY*30;
const MIN_VOTES = 100;

@Injectable()
export class PetitionsService
{
    constructor(
                private petitionRepository: PetitionRepository,
                private schedulingService: SchedulingService,
                private resolutionsService: ResolutionsService
                ) {}

    async getPetitionsPageBySchool(params: PetitionQueryParams, user: User): Promise<Page<PetitionInfo>>
    {
        const { pageElements: petitions, totalPages } = await this.petitionRepository.getPetitionsPage(params);
        let petitionInfoArr: PetitionInfo[] = [];

        if (user)
        {
            petitionInfoArr = await this.petitionRepository.mapPetitionsToAuthPetitionsInfo(petitions, user);
        }
        else
        {
            petitionInfoArr = await this.petitionRepository.mapPetitionsToPetitionsInfo(petitions);
        }

        return {
            pageElements: petitionInfoArr,
            totalPages
        };
    }


    async postPetition(user: StudentUser, createPetitionDto: CreatePetitionDto): Promise<number>
    {
        const { title, description } = createPetitionDto;
        const deadline = new Date(Date.now() + RESOLUTION_WINDOW);

        const newPetition = new Petition();
        newPetition.campus = user.school.campus;
        newPetition.title = title;
        newPetition.description = description;
        newPetition.status = PetitionStatus.NO_RESOLUTION;
        newPetition.by = user;
        newPetition.deadline = deadline;

        const { id } = await this.petitionRepository.save(newPetition);
        
        return id;
    }


    async createAssociatedResolution(petitionId: number): Promise<Resolution>
    {
        const resolution = await this.resolutionsService.createResolution(petitionId);
        await this.petitionRepository.update(petitionId, { status: PetitionStatus.IN_PROGRESS });
        return resolution;
    }


    async getPetitionInfoById(petitionId: number, user: User): Promise<PetitionInfo>
    {
        const petition = await this.petitionRepository.findOne(petitionId);
        if (!petition) throw new NotFoundException();

        if (user)
        {
            return await this.petitionRepository.getAuthPetitionInfoWDesc(petition, user);
        }
        
        return await this.petitionRepository.getPetitionInfoWDesc(petition);
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
            const associatedRes = await this.createAssociatedResolution(petitionId);
            await this.resolutionsService.triggerNewResolutionNotifications(associatedRes);
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

    async deletePetition(petitionId: number, user: StudentUser): Promise<void>
    {
        const petition = await this.petitionRepository.findOne(petitionId, { relations: ["resolution", "by"] });

        if (!petition) throw new NotFoundException();
        if (petition.by.id !== user.id) throw new UnauthorizedException();
        if (petition.resolution || await this.petitionRepository.countNumberOfVotes(petitionId) > 0) throw new ConflictException();

        await this.petitionRepository.deletePetitionAndSavedRelations(petitionId);
    }
}
