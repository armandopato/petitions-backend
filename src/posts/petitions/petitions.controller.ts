import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { PetitionsService } from './petitions.service';
import { JwtOptionalAuthGuard } from 'src/auth/guards/jwt-optional-auth.guard';
import { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/util/page/page.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsStudentGuard } from 'src/auth/guards/is-student.guard';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { PositiveIntPipe } from 'src/util/positive-int.pipe';
import { StudentUser, User } from '../../users/entities/user.entity';
import { PetitionCommentsService } from './comments/petition-comments.service';
import { PetitionInfo } from './interfaces/petition-info.interface';
import { ApiTags } from '@nestjs/swagger';
import { CommentsController } from '../../comments/comments.controller';
import { PetitionComment } from '../../comments/comment.entity';

@ApiTags('Petitions')
@Controller('petitions')
export class PetitionsController extends CommentsController<PetitionComment>
{
    constructor(private readonly petitionsService: PetitionsService,
                commentsService: PetitionCommentsService)
    {
        super(commentsService);
    }
    
    @UseGuards(JwtOptionalAuthGuard)
    @Get()
    async getInfoPage(@Request() req: AuthRequest<User>,
                      @Query() petitionQueryParams: PetitionQueryParams): Promise<Page<PetitionInfo>>
    {
        return await this.petitionsService.getInfoPage(petitionQueryParams, req.user);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Post()
    async create(@Request() req: AuthRequest<StudentUser>,
                 @Body() createPetitionDto: CreatePetitionDto): Promise<{ id: number }>
    {
        const id = await this.petitionsService.create(req.user, createPetitionDto);
        return { id };
    }
    
    @UseGuards(JwtOptionalAuthGuard)
    @Get('/:id')
    async getInfoById(@Request() req: AuthRequest<User>,
                      @Param('id', PositiveIntPipe) petitionId: number): Promise<PetitionInfo>
    {
        return await this.petitionsService.getInfoById(petitionId, req.user);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Post('/:id')
    async voteById(@Request() req: AuthRequest<StudentUser>,
                   @Param('id', PositiveIntPipe) petitionId: number): Promise<void>
    {
        await this.petitionsService.voteById(petitionId, req.user);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('saved')
    async getSavedInfoPage(@Request() req: AuthRequest<User>,
                           @Query('page', PositiveIntPipe) page: number): Promise<Page<PetitionInfo>>
    {
        return await this.petitionsService.getSavedInfoPage(req.user, page);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch('/:id')
    async toggleSavedById(@Request() req: AuthRequest<User>,
                          @Param('id', PositiveIntPipe) petitionId: number): Promise<void>
    {
        return await this.petitionsService.toggleSavedById(petitionId, req.user);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Delete('/:id')
    async deleteById(@Request() req: AuthRequest<StudentUser>,
                     @Param('id', PositiveIntPipe) petitionId: number): Promise<void>
    {
        await this.petitionsService.deleteById(petitionId, req.user);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Put('/:id')
    async updateById(@Request() req: AuthRequest<StudentUser>, @Param('id', PositiveIntPipe) petitionId: number,
                     @Body() createPetitionDto: CreatePetitionDto): Promise<void>
    {
        await this.petitionsService.updateById(petitionId, req.user, createPetitionDto);
    }
}
