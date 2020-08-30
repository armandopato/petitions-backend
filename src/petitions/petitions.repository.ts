import { EntityRepository, Repository, getConnection } from "typeorm";
import { Petition } from "src/entities/petition.entity";
import { PetitionStatus } from "src/types/ElementStatus";
import { User } from "src/entities/user.entity";


@EntityRepository(Petition)
export class PetitionRepository extends Repository<Petition>
{
    async countNumberOfVotes(id: number): Promise<number>
    {
        return await getConnection().createQueryBuilder(User, "user")
                                    .innerJoinAndSelect("user.votedPetitions", "petition")
                                    .where("petition.id = :id", { id: id })
                                    .getCount();
    }

    async countNumberOfComments(id: number): Promise<number>
    {
        return await getConnection().createQueryBuilder(Comment, "comment")
                        .innerJoinAndSelect("comment.petition", "petition")
                        .where("petition.id = :id", { id: id })
						.getCount();
    }

    async didUserVote(id: number, userId: number): Promise<boolean>
    {
        const vote = await getConnection().createQueryBuilder(User, "user")
                                            .innerJoinAndSelect("user.votedPetitions", "petition")
                                            .where("user.id = :userId", { userId: userId })
                                            .andWhere("petition.id = :id", { id: id })
                                            .getOne();
        return vote ? true : false;
    }

    async getPetitionStatus(id: number): Promise<PetitionStatus>
    {
        const petition = await this.findOne(id, { relations: ["resolution"] });
        
        if (!petition.resolution) return PetitionStatus.NO_RESOLUTION;

        else if (petition.resolution.resolutionText) return PetitionStatus.TERMINATED;

        else if (petition.resolution.deadline < new Date(Date.now())) return PetitionStatus.OVERDUE;

        else return PetitionStatus.IN_PROGRESS;
    }
}