import { CommentsRepository } from './comments.repository';
import { GenericComment } from './comment.entity';
import { StudentUser, User } from '../users/entities/user.entity';
import { Page } from '../util/page/page.interface';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FOREIGN_KEY_VIOLATION_ERRCODE } from '../util/constants';
import { CommentInfo } from './interfaces/comment-info.interface';

export abstract class CommentsService<CommentType extends GenericComment>
{
    protected constructor(private readonly commentsRepository: CommentsRepository<CommentType>)
    {
    }
    
    async getInfoPage(elementId: number, user: User, pageNumber: number): Promise<Page<CommentInfo>>
    {
        const page = await this.commentsRepository.getPage(elementId, pageNumber, user);
        return await this.pageToInfoPage(user, page);
    }
    
    async pageToInfoPage(user: User, page: Page<CommentType>): Promise<Page<CommentInfo>>
    {
        const comments = page.pageElements;
        let postInfoArr = await Promise.all(comments.map(comment => this.getInfo(comment)));
        
        if (user)
        {
            postInfoArr = await Promise.all(postInfoArr.map(info => this.addAuthInfo(user, info)));
        }
    
        return {
            pageElements: postInfoArr,
            totalPages: page.totalPages,
        };
    }
    
    async getUserCommentInfo<CommentType extends GenericComment>(elementId: number,
                                                                 user: StudentUser): Promise<CommentInfo>
    {
        const comment = await this.commentsRepository.getUserComment(elementId, user.id);
        if (!comment) throw new NotFoundException();
        const info = await this.getInfo(comment);
        return await this.addAuthInfo(user, info);
    }
    
    abstract async createNewInstanceWithConditions(elementId?: number): Promise<CommentType>;
    
    async create<CommentType extends GenericComment>(elementId: number, user: StudentUser,
                                                     commentText: string): Promise<void>
    {
        const userComment = await this.commentsRepository.getUserComment(elementId, user.id);
        if (userComment) throw new ConflictException();
        
        const newComment = await this.createNewInstanceWithConditions(elementId);
        newComment.by = user;
        newComment.element = { id: elementId };
        newComment.text = commentText;
        
        try
        {
            await this.commentsRepository.save(newComment as any);
        }
        catch (err)
        {
            if (Number(err.code) === FOREIGN_KEY_VIOLATION_ERRCODE) throw new NotFoundException('Post does not exist');
            else throw new InternalServerErrorException();
        }
    }
    
    async update(elementId: number, user: StudentUser, newCommentText: string): Promise<void>
    {
        const userComment = await this.commentsRepository.getUserComment(elementId, user.id);
        if (!userComment) throw new NotFoundException();
        
        await this.commentsRepository.update(userComment.id, { text: newCommentText } as any);
    }
    
    async delete(elementId: number, user: StudentUser): Promise<void>
    {
        const comment = await this.commentsRepository.getUserComment(elementId, user.id);
        if (!comment) throw new NotFoundException();
        
        await this.commentsRepository.deleteById(comment);
    }
    
    async toggleLiked(commentId: number, user: StudentUser): Promise<void>
    {
        const didUserLikeComment = await this.commentsRepository.didUserLike(commentId, user.id);
        
        try
        {
            if (didUserLikeComment)
            {
                await this.commentsRepository.dislikeById(commentId, user.id);
            }
            else
            {
                await this.commentsRepository.likeById(commentId, user.id);
            }
        }
        catch (err)
        {
            if (Number(err.code) === FOREIGN_KEY_VIOLATION_ERRCODE) throw new NotFoundException();
            else throw new InternalServerErrorException();
        }
    }
    
    async countPostComments(postId: number): Promise<number>
    {
        return await this.commentsRepository.countPostComments(postId);
    }
    
    async getInfo(comment: CommentType): Promise<CommentInfo>
    {
        return {
            id: comment.id,
            date: comment.createdDate,
            text: comment.text,
            numLikes: await this.commentsRepository.getLikes(comment.id),
        };
    }
    
    async addAuthInfo(user: User, commentInfo: CommentInfo): Promise<CommentInfo>
    {
        const commentWithAuthInfo = { ...commentInfo };
        commentWithAuthInfo.didLike = await this.commentsRepository.didUserLike(commentInfo.id, user.id);
        return commentWithAuthInfo;
    }
}
