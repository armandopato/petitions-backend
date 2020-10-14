import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { IsSupportGuard } from 'src/auth/guards/isSupport.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtOptionalAuthGuard } from 'src/auth/guards/jwt-optional-auth.guard';
import { AuthRequest, AuthStudentRequest, AuthSupportRequest } from 'src/auth/AuthRequest.interface';
import { CommentInfo, ResolutionInfo } from 'src/posts/ElementInfo';
import { Page } from 'src/util/Page';
import { PositiveIntPipe } from 'src/util/positive-int.pipe';
import { PostTerminatedResolutionDto } from './dto/post-terminated-resolution.dto';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionsService } from './resolutions.service';
import { ResolutionTextDto } from './dto/terminate-resolution.dto';
import { IsStudentGuard } from '../../auth/guards/isStudent.guard';
import { PostCommentDto } from '../../comments/dto/post-comment.dto';
import { ResolutionCommentService } from './resolution-comment/resolution-comment.service';

@Controller('resolutions')
export class ResolutionsController
{
	
	constructor(private resolutionsService: ResolutionsService,
	            private commentsService: ResolutionCommentService)
	{
	}
	
	@UseGuards(JwtOptionalAuthGuard)
	@Get()
	async getResolutionsPageBySchool(@Request() req: AuthRequest, @Query() resolutionQueryParams: ResolutionQueryParams): Promise<Page<ResolutionInfo>>
	{
		return await this.resolutionsService.getInfoPage(resolutionQueryParams, req.user);
	}
	
	@UseGuards(JwtAuthGuard, IsSupportGuard)
	@Post()
	async postTerminatedResolution(@Request() req: AuthSupportRequest, @Body() postTerminatedResolutionDto: PostTerminatedResolutionDto): Promise<{ resolutionId: number }>
	{
		return {
			resolutionId: await this.resolutionsService.resolvePetition(postTerminatedResolutionDto, req.user),
		};
	}
	
	@UseGuards(JwtOptionalAuthGuard)
	@Get(':id')
	async getResolutionById(@Request() req: AuthRequest, @Param('id', PositiveIntPipe) resolutionId: number): Promise<ResolutionInfo>
	{
		return await this.resolutionsService.getInfoById(resolutionId, req.user);
	}
	
	@UseGuards(JwtOptionalAuthGuard, IsSupportGuard)
	@Put(':id')
	async terminateResolutionById(@Request() req: AuthSupportRequest, @Param('id', PositiveIntPipe) resolutionId: number, @Body() resolutionTextDto: ResolutionTextDto): Promise<void>
	{
		await this.resolutionsService.terminateResolution(resolutionId, req.user, resolutionTextDto.resolutionText);
	}
	
	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	async saveOrUnsaveResolution(@Request() req: AuthRequest, @Param('id', PositiveIntPipe) resolutionId: number): Promise<void>
	{
		return await this.resolutionsService.saveOrUnsave(resolutionId, req.user);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Post(':id')
	async voteResolution(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) resolutionId: number): Promise<void>
	{
		return await this.resolutionsService.vote(resolutionId, req.user);
	}
	
	// COMMENTS
	
	@UseGuards(JwtOptionalAuthGuard)
	@Get('/:id/comments')
	async getCommentsPage(@Request() req: AuthRequest, @Param('id', PositiveIntPipe) resolutionId: number, @Query('page', PositiveIntPipe) page: number): Promise<Page<CommentInfo>>
	{
		return await this.commentsService.getCommentInfoPage(resolutionId, req.user, page);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Post('/:id/comments')
	async postComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) resolutionId: number, @Body() postCommentDto: PostCommentDto): Promise<void>
	{
		await this.commentsService.postComment(resolutionId, req.user, postCommentDto.comment);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Get('/:id/mycomment')
	async getMyComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) resolutionId: number): Promise<{ myComment: CommentInfo }>
	{
		return { myComment: await this.commentsService.getMyCommentInfo(resolutionId, req.user) };
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Put('/:id/mycomment')
	async editComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) resolutionId: number, @Body() putCommentDto: PostCommentDto): Promise<void>
	{
		await this.commentsService.editMyComment(resolutionId, req.user, putCommentDto.comment);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Delete('/:id/mycomment')
	async deleteComment(@Request() req: AuthStudentRequest, @Param('id', PositiveIntPipe) resolutionId: number): Promise<void>
	{
		await this.commentsService.deleteMyComment(resolutionId, req.user);
	}
	
	@UseGuards(JwtAuthGuard, IsStudentGuard)
	@Patch('/comments/:commentId')
	async likeOrDislikeComment(@Request() req: AuthStudentRequest, @Param('commentId', PositiveIntPipe) commentId: number): Promise<void>
	{
		await this.commentsService.likeOrDislikeComment(commentId, req.user);
	}
}
