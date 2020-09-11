import { Injectable, NotFoundException } from '@nestjs/common';
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

        this.schedulingService.schedulePetitionDeadline(id, deadline);
        
        return id;
    }


    async createAssociatedResolution(petitionId: number): Promise<void>
    {
        await this.resolutionsService.createResolution(petitionId);
        await this.petitionRepository.update(petitionId, { status: PetitionStatus.IN_PROGRESS });
    }


    async getPetitionInfoById(petitionId: number, user: User): Promise<PetitionInfo>
    {
        const petition = await this.petitionRepository.findOne(petitionId);
        if (!petition) throw new NotFoundException();

        if (user)
        {
            return await this.petitionRepository.getAuthPetitionInfo(petition, user);
        }
        
        return await this.petitionRepository.getPetitionInfo(petition);
    }
}
