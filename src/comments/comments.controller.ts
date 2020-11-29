import { Body, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';
import { AuthRequest } from '../auth/interfaces/auth-request.interface';
import { StudentUser, User } from '../users/entities/user.entity';
import { PositiveIntPipe } from '../util/positive-int.pipe';
import { Page } from '../util/page/page.interface';
import { CommentInfo } from './interfaces/comment-info.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsStudentGuard } from '../auth/guards/is-student.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';
import { GenericComment } from './comment.entity';

export abstract class CommentsController<CommentType extends GenericComment>
{
    protected constructor(private readonly commentsService: CommentsService<CommentType>)
    {
    }
    
    @UseGuards(JwtOptionalAuthGuard)
    @Get('/:id/comments')
    async getCommentInfoPage(@Request() req: AuthRequest<User>, @Param('id', PositiveIntPipe) postId: number,
                             @Query('page', PositiveIntPipe) page: number): Promise<Page<CommentInfo>>
    {
        return await this.commentsService.getInfoPage(postId, req.user, page);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Post('/:id/comments')
    async createComment(@Request() req: AuthRequest<StudentUser>, @Param('id', PositiveIntPipe) postId: number,
                        @Body() createCommentDto: CreateCommentDto): Promise<void>
    {
        await this.commentsService.create(postId, req.user, createCommentDto.comment);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Get('/:id/mycomment')
    async getUserCommentInfo(@Request() req: AuthRequest<StudentUser>,
                             @Param('id', PositiveIntPipe) postId: number): Promise<{ myComment: CommentInfo }>
    {
        return { myComment: await this.commentsService.getUserCommentInfo(postId, req.user) };
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Put('/:id/mycomment')
    async update(@Request() req: AuthRequest<StudentUser>, @Param('id', PositiveIntPipe) postId: number,
                 @Body() createCommentDto: CreateCommentDto): Promise<void>
    {
        await this.commentsService.update(postId, req.user, createCommentDto.comment);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Delete('/:id/mycomment')
    async delete(@Request() req: AuthRequest<StudentUser>,
                 @Param('id', PositiveIntPipe) postId: number): Promise<void>
    {
        await this.commentsService.delete(postId, req.user);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Patch('/comments/:commentId')
    async toggleLiked(@Request() req: AuthRequest<StudentUser>,
                      @Param('commentId', PositiveIntPipe) commentId: number): Promise<void>
    {
        await this.commentsService.toggleLiked(commentId, req.user);
    }
}
