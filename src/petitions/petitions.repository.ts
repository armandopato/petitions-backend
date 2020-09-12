import { EntityRepository, Repository, getConnection } from "typeorm";
import { Petition } from "src/entities/petition.entity";
import { StudentUser, User } from "src/entities/user.entity";
import { PetitionComment } from "src/entities/comment.entity";
import { Page } from "src/types/Page";
import { PetitionQueryParams } from "./dto/petition-query-params.dto";
import { getPage } from "src/util/getPage";
import { OrderBy } from "src/types/OrderBy";
import { CommentInfo, PetitionInfo } from "src/types/ElementInfo";
import { PetitionStatus } from "src/types/ElementStatus";
import { CreatePetitionDto } from "./dto/create-petition.dto";


@EntityRepository(Petition)
export class PetitionRepository extends Repository<Petition>
{
    connection = getConnection();

    async getPetitionsPage(params: PetitionQueryParams): Promise<Page<Petition>>
    {
        const { page, orderBy, year, school, show, search } = params;
        const query = this.connection.createQueryBuilder(Petition, "petition")
                                    .where("petition.campus = :school", { school })
                                    .andWhere("date_part('year', petition.createdDate) = :year", { year });
        
        if (show)
        {
            query.andWhere("petition.status = :status", { status: show });
        }
        
        if (search)
        {
            query.andWhere("petition.title LIKE :search", { search: `%${search}%` });
            query.andWhere("petition.description LIKE :search", { search: `%${search}%` });
        }

        switch(orderBy)
        {
            case OrderBy.MOST_RECENT:
                query.orderBy("petition.id", "DESC");
                break;
            
            case OrderBy.OLDEST:
                query.orderBy("petition.id", "ASC");
                break;

            case OrderBy.NUMBER_OF_VOTES:
                query.leftJoin("petition_voted_by_user", "vote", "vote.petitionId = petition.id")
                    .addSelect("COUNT(vote.petitionId)", "votesperpetition")
                    .groupBy("petition.id")
                    .orderBy("votesperpetition", "DESC")
                    .addOrderBy("petition.id", "DESC");
                break;

            case OrderBy.RELEVANCE:
                query.orderBy("CASE WHEN petition.status = 'overdue' THEN 1 ELSE 2 END")
                    .addOrderBy("petition.id", "DESC");
                break;
        }

        return await getPage(query, page);
    }

    async countNumberOfVotes(id: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(StudentUser, "user")
                                    .innerJoinAndSelect("user.votedPetitions", "petition")
                                    .where("petition.id = :id", { id: id })
                                    .getCount();
    }

    async countNumberOfComments(id: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(PetitionComment, "comment")
                        .innerJoinAndSelect("comment.petition", "petition")
                        .where("petition.id = :id", { id: id })
						.getCount();
    }

    async didUserVote(id: number, userId: number): Promise<boolean>
    {
        const vote = await this.connection.createQueryBuilder(StudentUser, "user")
                                            .innerJoinAndSelect("user.votedPetitions", "petition")
                                            .where("user.id = :userId", { userId: userId })
                                            .andWhere("petition.id = :id", { id: id })
                                            .getCount();
        return vote === 1;
    }

    async didUserSave(id: number, userId: number): Promise<boolean>
    {
        const saved = await this.connection.createQueryBuilder(StudentUser, "user")
                                            .innerJoinAndSelect("user.savedPetitions", "petition")
                                            .where("user.id = :userId", { userId: userId })
                                            .andWhere("petition.id = :id", { id: id })
                                            .getCount();
        return saved === 1;
    }

    async getPetitionInfo(petition: Petition): Promise<PetitionInfo>
    {
        const numVotes = await this.countNumberOfVotes(petition.id);
        const numComments = await this.countNumberOfComments(petition.id);

        const petitionInfo: PetitionInfo = {
            id: petition.id,
            title: petition.title,
            date: petition.createdDate,
            status: petition.status,
            numVotes: numVotes,
            numComments: numComments
        };

        if (petition.status === PetitionStatus.NO_RESOLUTION)
        {
            petitionInfo.deadline = petition.deadline;
        }

        return petitionInfo;
    }

    async getAuthPetitionInfo(petition: Petition, user: User): Promise<PetitionInfo>
    {
        const petitionInfo = await this.getPetitionInfo(petition);
        petitionInfo.didSave = await this.didUserSave(petition.id, user.id);
        petitionInfo.didVote = await this.didUserVote(petition.id, user.id);
        return petitionInfo;
    }

    async getPetitionInfoWDesc(petition: Petition): Promise<PetitionInfo>
    {
        const petitionInfo = await this.getPetitionInfo(petition);
        petitionInfo.description = petition.description;
        return petitionInfo;
    }

    async getAuthPetitionInfoWDesc(petition: Petition, user: User): Promise<PetitionInfo>
    {
        const petitionInfo = await this.getAuthPetitionInfo(petition, user);
        petitionInfo.description = petition.description;
        return petitionInfo;
    }


    async mapPetitionsToPetitionsInfo(petitions: Petition[]): Promise<PetitionInfo[]>
    {
        const petitionsInfoArr: PetitionInfo[] = [];

        for (const petition of petitions)
        {
            const petitionInfo = await this.getPetitionInfo(petition);
            petitionsInfoArr.push(petitionInfo);
        }

        return petitionsInfoArr;
    }

    async mapPetitionsToAuthPetitionsInfo(petitions: Petition[], user: User): Promise<PetitionInfo[]>
    {
        const authPetitionsInfoArr: PetitionInfo[] = [];

        for (const petition of petitions)
        {
            const petitionInfo = await this.getAuthPetitionInfo(petition, user);
            authPetitionsInfoArr.push(petitionInfo);
        }

        return authPetitionsInfoArr;
    }



    async votePetition(petitionId: number, userId: number): Promise<void>
    {
        await this.connection.createQueryBuilder()
                            .relation(Petition, "votedBy")
                            .of(petitionId)
                            .add(userId);
    }

    async savePetition(petitionId: number, userId: number): Promise<void>
    {
        await this.connection.createQueryBuilder()
                .relation(Petition, "savedBy")
                .of(petitionId)
                .add(userId);
    }

    async unsavePetition(petitionId: number, userId: number): Promise<void>
    {
        await this.connection.createQueryBuilder()
                .relation(Petition, "savedBy")
                .of(petitionId)
                .remove(userId);
    }

    async deletePetitionAndSavedRelations(petitionId: number): Promise<void>
    {
        await this.connection.createQueryBuilder().delete()
                    .from("user_saved_petitions_petition")
                    .where("petitionId = :petitionId", { petitionId: petitionId })
                    .execute()

        await this.delete(petitionId);
    }

    async editPetition(petition: Petition, editPetitionDto: CreatePetitionDto): Promise<void>
    {
        petition.title = editPetitionDto.title;
        petition.description = editPetitionDto.description;

        await this.save(petition);
    }


    async getPetitionCommentsPage(petitionId: number, page: number): Promise<Page<PetitionComment>>
    {
        const query = this.connection.createQueryBuilder(PetitionComment, "comment")
                                    .innerJoin("comment.petition", "petition")
                                    .where("petition.id = :id", { id: petitionId })
                                    .orderBy("comment.id", "DESC");

        return await getPage(query, page);
    }

    async getNumberOfPetitionCommentLikes(commentId: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(StudentUser, "user")
                                    .innerJoinAndSelect("user.likedPetitionComments", "comment")
                                    .where("comment.id = :id", { id: commentId })
                                    .getCount();
    }

    async didUserLikePetitionComment(commentId: number, userId: number): Promise<boolean>
    {
        const like = await this.connection.createQueryBuilder(StudentUser, "user")
                                            .innerJoinAndSelect("user.likedPetitionComments", "comment")
                                            .where("user.id = :userId", { userId: userId })
                                            .andWhere("comment.id = :id", { id: commentId })
                                            .getCount();
        return like === 1;
    }

    async getCommentInfo(comment: PetitionComment): Promise<CommentInfo>
    {
        return {
            id: comment.id,
            date: comment.createdDate,
            text: comment.text,
            numLikes: await this.getNumberOfPetitionCommentLikes(comment.id)
        };
    }

    async getAuthCommentInfo(comment: PetitionComment, user: User): Promise<CommentInfo>
    {
        const commentInfo = await this.getCommentInfo(comment);
        commentInfo.didLike = await this.didUserLikePetitionComment(comment.id, user.id)
        return commentInfo;
    }

    async mapPetitionCommentsToCommentsInfo(comments: PetitionComment[]): Promise<CommentInfo[]>
    {
        const commentsInfoArr: CommentInfo[] = [];

        for (const comment of comments)
        {
            const commentInfo = await this.getCommentInfo(comment);
            commentsInfoArr.push(commentInfo);
        }

        return commentsInfoArr;
    }

    async mapPetitionCommentsToAuthCommentsInfo(comments: PetitionComment[], user: User): Promise<CommentInfo[]>
    {
        const authCommentsInfoArr: CommentInfo[] = [];

        for (const comment of comments)
        {
            const authCommentInfo = await this.getAuthCommentInfo(comment, user);
            authCommentsInfoArr.push(authCommentInfo);
        }

        return authCommentsInfoArr;
    }
}