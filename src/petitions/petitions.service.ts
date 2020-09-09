import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { PetitionInfo } from 'src/types/ElementInfo';

@Injectable()
export class PetitionsService
{
    async getPetitionsPageBySchool(params: PetitionQueryParams, user: User): Promise<Page<PetitionInfo>>
    {
        return null;
    }
}
