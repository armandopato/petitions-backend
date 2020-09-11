import { Controller, Get, UseGuards, Request, Query, Post, Body, Param } from '@nestjs/common';
import { PetitionsService } from './petitions.service';
import { JwtOptionalAuthGuard } from 'src/auth/guards/jwt-optional-auth.guard';
import { AuthRequest, AuthStudentRequest } from 'src/types/AuthRequest';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { PetitionInfo } from 'src/types/ElementInfo';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsStudentGuard } from 'src/auth/guards/isStudent.guard';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { PositiveIntPipe } from 'src/util/positive-int.pipe';

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

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Post()
    async postPetition(@Request() req: AuthStudentRequest, @Body() createPetitionDto: CreatePetitionDto): Promise<{ id: number }>
    {
        const id = await this.petitionsService.postPetition(req.user, createPetitionDto);
        return { id };
    }

    @UseGuards(JwtOptionalAuthGuard)
    @Get("/:id")
    async getPetitionInfoById(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<PetitionInfo>
    {
        return await this.petitionsService.getPetitionInfoById(petitionId, req.user);
    }
}
