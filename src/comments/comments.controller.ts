import { Body, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';
import { AuthRequest } from '../auth/interfaces/auth-request.interface';
import { StudentUser, User } from '../users/entities/user.entity';
import { PositiveIntPipe } from '../util/positive-int.pipe';
import { Page } from '../util/page/page.interface';
import { CommentInfo } from './interfaces/comment-info.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsStudentGuard } from '../auth/guards/is-student.guard';
import { PostCommentDto } from './dto/post-comment.dto';
import { CommentsService } from './comments.service';
import { GenericComment } from './comment.entity';

export abstract class CommentsController<CommentType extends GenericComment>
{
    protected constructor(private readonly commentsService: CommentsService<CommentType>)
    {
    }
    
    @UseGuards(JwtOptionalAuthGuard)
    @Get('/:id/comments')
    async getCommentsPage(@Request() req: AuthRequest<User>, @Param('id', PositiveIntPipe) postId: number,
                          @Query('page', PositiveIntPipe) page: number): Promise<Page<CommentInfo>>
    {
        return await this.commentsService.getCommentInfoPage(postId, req.user, page);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Post('/:id/comments')
    async postComment(@Request() req: AuthRequest<StudentUser>, @Param('id', PositiveIntPipe) postId: number,
                      @Body() postCommentDto: PostCommentDto): Promise<void>
    {
        await this.commentsService.postComment(postId, req.user, postCommentDto.comment);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Get('/:id/mycomment')
    async getMyComment(@Request() req: AuthRequest<StudentUser>,
                       @Param('id', PositiveIntPipe) postId: number): Promise<{ myComment: CommentInfo }>
    {
        return { myComment: await this.commentsService.getMyCommentInfo(postId, req.user) };
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Put('/:id/mycomment')
    async editComment(@Request() req: AuthRequest<StudentUser>, @Param('id', PositiveIntPipe) postId: number,
                      @Body() putCommentDto: PostCommentDto): Promise<void>
    {
        await this.commentsService.editMyComment(postId, req.user, putCommentDto.comment);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Delete('/:id/mycomment')
    async deleteComment(@Request() req: AuthRequest<StudentUser>,
                        @Param('id', PositiveIntPipe) postId: number): Promise<void>
    {
        await this.commentsService.deleteMyComment(postId, req.user);
    }
    
    @UseGuards(JwtAuthGuard, IsStudentGuard)
    @Patch('/comments/:commentId')
    async likeOrDislikeComment(@Request() req: AuthRequest<StudentUser>,
                               @Param('commentId', PositiveIntPipe) commentId: number): Promise<void>
    {
        await this.commentsService.likeOrDislikeComment(commentId, req.user);
    }
}
