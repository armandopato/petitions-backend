import { Controller, Get, UseGuards, Request, Query, Post, Body, Param, Delete, Put, Patch } from '@nestjs/common';
import { PetitionsService } from './petitions.service';
import { JwtOptionalAuthGuard } from 'src/auth/guards/jwt-optional-auth.guard';
import { AuthRequest, AuthStudentRequest } from 'src/types/AuthRequest';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { CommentInfo, PetitionInfo } from 'src/types/ElementInfo';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsStudentGuard } from 'src/auth/guards/isStudent.guard';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { PositiveIntPipe } from 'src/util/positive-int.pipe';
import { PostCommentDto } from './dto/post-comment.dto';

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

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Post("/:id")
    async votePetition(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<void>
    {
        await this.petitionsService.votePetition(petitionId, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("/:id")
    async saveOrUnsavePetition(@Request() req: AuthRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<void>
    {
        await this.petitionsService.saveOrUnsavePetition(petitionId, req.user);
    }

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Delete("/:id")
    async deletePetition(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<void>
    {
        await this.petitionsService.deletePetition(petitionId, req.user);
    }

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Put("/:id")
    async editPetition(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number, @Body() editPetitionDto: CreatePetitionDto): Promise<void>
    {
        await this.petitionsService.editPetition(petitionId, req.user, editPetitionDto);
    }

    @UseGuards(JwtOptionalAuthGuard)
    @Get("/:id/comments")
    async getCommentsPage(@Request() req: AuthRequest, @Param('id', PositiveIntPipe) petitionId: number, @Query("page", PositiveIntPipe) page: number): Promise<Page<CommentInfo>>
    {
        return await this.petitionsService.getPetitionCommentsInfoPage(petitionId, req.user, page);
    }

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Get("/:id/mycomment")
    async getMyComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<{ myComment: CommentInfo }>
    {
        return { myComment: await this.petitionsService.getMyCommentInfo(petitionId, req.user) };
    }

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Post("/:id/comments")
    async postComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number, @Body() postCommentDto: PostCommentDto): Promise<void>
    {
        await this.petitionsService.postComment(petitionId, req.user, postCommentDto.comment);
    }

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Put("/:id/comments/:commentId")
    async editComment(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Delete("/:id/comments/:commentId")
    async deleteComment(): Promise<void>
    {
        return;
    }

    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Patch("/:id/comments/:commentId")
    async likeComment(): Promise<void>
    {
        return;
    }
}
