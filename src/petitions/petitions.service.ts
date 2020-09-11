import { Injectable } from '@nestjs/common';
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

const DAY = 1000*60*60*24;
const RESOLUTION_WINDOW = DAY*30;

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

    async mapPetitionsToPetitionsInfo(petitions: Petition[]): Promise<PetitionInfo[]>
    {
        const petitionInfoArr: PetitionInfo[] = [];

        for (const petition of petitions)
        {
            const numVotes = await this.petitionRepository.countNumberOfVotes(petition.id);
            const numComments = await this.petitionRepository.countNumberOfComments(petition.id);
            const petitionInfo: PetitionInfo = {
                id: petition.id,
                title: petition.title,
                date: petition.createdDate,
                status: petition.status,
                numVotes: numVotes,
                numComments: numComments
            };

            if (petition.status === PetitionStatus.NO_RESOLUTION)
            {
                petitionInfo.deadline = petition.deadline;
            }

            petitionInfoArr.push(petitionInfo);
        }

        return petitionInfoArr;
    }

    async mapPetitionsToAuthPetitionsInfo(petitions: Petition[], user: User): Promise<PetitionInfo[]>
    {
        const petitionInfoArr = await this.mapPetitionsToPetitionsInfo(petitions);

        for (const info of petitionInfoArr)
        {
            info.didVote = await this.petitionRepository.didUserVote(info.id, user.id);
            info.didSave = await this.petitionRepository.didUserSave(info.id, user.id);
        }

        return petitionInfoArr;
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

        this.schedulingService.schedulePetitionDeadline(id, deadline);
        
        return id;
    }

    async createAssociatedResolution(petitionId: number): Promise<void>
    {
        await this.resolutionsService.createResolution(petitionId);
        await this.petitionRepository.update(petitionId, { status: PetitionStatus.IN_PROGRESS });
    }
}
