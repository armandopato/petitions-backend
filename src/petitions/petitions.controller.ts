import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { PetitionsService } from './petitions.service';
import { JwtOptionalAuthGuard } from 'src/auth/guards/jwt-optional-auth.guard';
import { AuthRequest } from 'src/types/AuthRequest';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { PetitionInfo } from 'src/types/ElementInfo';

@Controller('petitions')
export class PetitionsController
{
    constructor(private petitionsService: PetitionsService) {}

    @UseGuards(JwtOptionalAuthGuard)
    @Get()
    async getPetitionsPageBySchool(@Request() req: AuthRequest, @Query() petitionQueryParams: PetitionQueryParams): Promise<Page<PetitionInfo>>
    {
        return await this.petitionsService.getPetitionsPageBySchool(petitionQueryParams, req.user);
    }
}
