import { EntityRepository, Repository, getConnection } from "typeorm";
import { Petition } from "src/entities/petition.entity";
import { StudentUser } from "src/entities/user.entity";
import { PetitionComment } from "src/entities/comment.entity";
import { Page } from "src/types/Page";
import { PetitionQueryParams } from "./dto/petition-query-params.dto";
import { getPage } from "src/util/getPage";
import { OrderBy } from "src/types/OrderBy";


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
                query.leftJoin("petition.votedBy", "vote")
                    .groupBy("petition.id")
                    .orderBy("count(vote.petitionId)");
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
}