import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StudentUser, User } from 'src/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { CommentInfo, PetitionInfo } from 'src/types/ElementInfo';
import { PetitionRepository } from './petitions.repository';
import { Petition } from 'src/entities/petition.entity';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { ResolutionsService } from 'src/resolutions/resolutions.service';
import { PetitionComment } from 'src/entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


const MIN_VOTES = 100;

@Injectable()
export class PetitionsService
{
    constructor(
                private petitionRepository: PetitionRepository,
                private resolutionsService: ResolutionsService,
                @InjectRepository(PetitionComment)
                private petitionCommentRepository: Repository<PetitionComment>
                ) {}

    async getPetitionsPageBySchool(params: PetitionQueryParams, user: User): Promise<Page<PetitionInfo>>
    {
        const { pageElements: petitions, totalPages } = await this.petitionRepository.getPetitionsPage(params);
        let petitionInfoArr: PetitionInfo[];

        if (user)
        {
            petitionInfoArr = await this.petitionRepository.mapPetitionsToAuthPetitionsInfo(petitions, user);
        }
        else
        {
            petitionInfoArr = await this.petitionRepository.mapPetitionsToPetitionsInfo(petitions);
        }

        return {
            pageElements: petitionInfoArr,
            totalPages
        };
    }


    async postPetition(user: StudentUser, createPetitionDto: CreatePetitionDto): Promise<number>
    {
        const { title, description } = createPetitionDto;

        const newPetition = new Petition();
        newPetition.campus = user.school.campus;
        newPetition.title = title;
        newPetition.description = description;
        newPetition.by = user;

        const { id } = await this.petitionRepository.save(newPetition);
        
        return id;
    }


    async getPetitionInfoById(petitionId: number, user: User): Promise<PetitionInfo>
    {
        const petition = await this.petitionRepository.findOne(petitionId);
        if (!petition) throw new NotFoundException();

        if (user)
        {
            return await this.petitionRepository.getAuthPetitionInfoWDesc(petition, user);
        }
        
        return await this.petitionRepository.getPetitionInfoWDesc(petition);
    }


    async votePetition(petitionId: number, user: StudentUser): Promise<void>
    {
        const didUserVote = await this.petitionRepository.didUserVote(petitionId, user.id);
        if (didUserVote) throw new ConflictException();

        try
        {
            await this.petitionRepository.votePetition(petitionId, user.id);
        }
        catch(err)
        {
            if (Number(err.code) === 23503) throw new NotFoundException();
            else throw new InternalServerErrorException();
        }
        if (await this.petitionRepository.countNumberOfVotes(petitionId) >= MIN_VOTES)
        {
            await this.resolutionsService.createAssociatedResolution(petitionId);
        }
    }


    async saveOrUnsavePetition(petitionId: number, user: User): Promise<void>
    {
        const didUserSave = await this.petitionRepository.didUserSave(petitionId, user.id);
        
        try
        {
            if (didUserSave) 
            {
                await this.petitionRepository.unsavePetition(petitionId, user.id);
            }
            else
            {
                await this.petitionRepository.savePetition(petitionId, user.id);
            }
        }
        catch(err)
        {
            if (Number(err.code) === 23503) throw new NotFoundException();
            else throw new InternalServerErrorException();
        }
    }
    
    private async checkPetitionMutationValidity(petitionId: number, userId: number): Promise<Petition>
    {
        const petition = await this.petitionRepository.findOne(petitionId, { relations: ["resolution", "by"] });

        if (!petition) throw new NotFoundException();
        if (petition.by.id !== userId) throw new UnauthorizedException();
        if (petition.resolution || await this.petitionRepository.countNumberOfVotes(petitionId) > 0) throw new ConflictException();

        return petition;
    }

    async deletePetition(petitionId: number, user: StudentUser): Promise<void>
    {
        await this.checkPetitionMutationValidity(petitionId, user.id);
        await this.petitionRepository.deletePetitionAndSavedRelations(petitionId);
    }

    async editPetition(petitionId: number, user: StudentUser, editPetitionDto: CreatePetitionDto): Promise<void>
    {
        const petition = await this.checkPetitionMutationValidity(petitionId, user.id);
        await this.petitionRepository.editPetition(petition, editPetitionDto);
    }

    async getPetitionCommentsInfoPage(petitionId: number, user: User, page: number): Promise<Page<CommentInfo>>
    {
        const { totalPages, pageElements: comments } = await this.petitionRepository.getPetitionCommentsPage(petitionId, page);
        let commentInfoArr: CommentInfo[];

        if (user)
        {
            commentInfoArr = await this.petitionRepository.mapPetitionCommentsToAuthCommentsInfo(comments, user);
        }
        else
        {
            commentInfoArr = await this.petitionRepository.mapPetitionCommentsToCommentsInfo(comments);
        }

        return {
            pageElements: commentInfoArr,
            totalPages
        };
    }

    async getMyCommentInfo(petitionId: number, user: StudentUser): Promise<CommentInfo>
    {
        return await this.petitionRepository.getUserCommentInfo(petitionId, user.id);
    }

    
    async postComment(petitionId: number, user: StudentUser, commentText: string): Promise<void>
    {
        const userComment = await this.petitionRepository.getUserComment(petitionId, user.id);
        if (userComment) throw new ConflictException();

        const newComment = new PetitionComment();
        newComment.by = user;
        newComment.petition = { id: petitionId } as Petition;
        newComment.text = commentText;

        await this.petitionCommentRepository.save(newComment);
    }


    async editMyComment(petitionId: number, user: StudentUser, newCommentText: string): Promise<void>
    {
        const userComment = await this.petitionRepository.getUserComment(petitionId, user.id);
        if (!userComment) throw new NotFoundException();

        await this.petitionCommentRepository.update(userComment.id, { text: newCommentText });
    }

    async deleteMyComment(petitionId: number, user: StudentUser): Promise<void>
    {
        const comment = await this.petitionRepository.getUserComment(petitionId, user.id);
        if (!comment) throw new NotFoundException();

        await this.petitionRepository.deleteComment(comment);
    }

    async likeOrDislikeComment(commentId: number, user: StudentUser): Promise<void>
    {
        const didUserLikeComment = await this.petitionRepository.didUserLikePetitionComment(commentId, user.id)
        
        try
        {
            if (didUserLikeComment)
            {
                await this.petitionRepository.dislikeComment(commentId, user.id);
            }
            else
            {
                await this.petitionRepository.likeComment(commentId, user.id);
            }
        }
        catch(err)
        {
            if (Number(err.code) === 23503) throw new NotFoundException();
            else throw new InternalServerErrorException();
        }
    }
}
