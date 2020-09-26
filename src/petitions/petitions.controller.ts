import {
	Controller,
	Get,
	UseGuards,
	Request,
	Query,
	Post,
	Body,
	Param,
	Delete,
	Put,
	Patch,
	Injectable,
} from '@nestjs/common';
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
import { PostCommentDto } from '../comments/dto/post-comment.dto';
import { CommentsService } from '../comments/comments.service';
import { PetitionComment } from '../entities/comment.entity';

@Injectable()
@Controller('petitions')
export class PetitionsController
{
	constructor(private petitionsService: PetitionsService,
	            private commentsService: CommentsService) {}
	
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
	async getPetitionInfoById(@Request() req: AuthRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<PetitionInfo>
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
	
	// COMMENTS
	
	@UseGuards(JwtOptionalAuthGuard)
	@Get("/:id/comments")
	async getCommentsPage(@Request() req: AuthRequest, @Param('id', PositiveIntPipe) petitionId: number, @Query("page", PositiveIntPipe) page: number): Promise<Page<CommentInfo>>
	{
		return await this.commentsService.getCommentInfoPage(petitionId, PetitionComment, req.user, page);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Post("/:id/comments")
	async postComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number, @Body() postCommentDto: PostCommentDto): Promise<void>
	{
		await this.commentsService.postComment(petitionId, PetitionComment, req.user, postCommentDto.comment);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Get("/:id/mycomment")
	async getMyComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<{ myComment: CommentInfo }>
	{
		return { myComment: await this.commentsService.getMyCommentInfo(petitionId, PetitionComment, req.user) };
	}
	
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Put("/:id/mycomment")
	async editComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number, @Body() putCommentDto: PostCommentDto): Promise<void>
	{
		await this.commentsService.editMyComment(petitionId, PetitionComment, req.user, putCommentDto.comment);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Delete("/:id/mycomment")
	async deleteComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) petitionId: number): Promise<void>
	{
		await this.commentsService.deleteMyComment(petitionId, PetitionComment, req.user);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Patch("/comments/:commentId")
	async likeOrDislikeComment(@Request() req: AuthStudentRequest, @Param('commentId', PositiveIntPipe) commentId: number): Promise<void>
	{
		await this.commentsService.likeOrDislikeComment(commentId, PetitionComment, req.user);
	}
}
