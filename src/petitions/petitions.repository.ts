import { EntityRepository, Repository, getConnection } from "typeorm";
import { Petition } from "src/entities/petition.entity";
import { PetitionStatus } from "src/types/ElementStatus";
import { StudentUser } from "src/entities/user.entity";
import { PetitionComment } from "src/entities/comment.entity";
import { Resolution } from "src/entities/resolution.entity";


@EntityRepository(Petition)
export class PetitionRepository extends Repository<Petition>
{
    connection = getConnection();

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

    async getPetitionStatus(id: number): Promise<PetitionStatus>
    {
        const resolution = await this.connection.createQueryBuilder(Resolution, "resolution")
                                                .innerJoinAndSelect("resolution.petition", "petition")
                                                .where("petition = :id", { id: id })
                                                .getOne();
        
        if (!resolution) return PetitionStatus.NO_RESOLUTION;

        else if (resolution.resolutionText) return PetitionStatus.TERMINATED;

        else if (resolution.deadline < new Date(Date.now())) return PetitionStatus.OVERDUE;

        else return PetitionStatus.IN_PROGRESS;
    }
}