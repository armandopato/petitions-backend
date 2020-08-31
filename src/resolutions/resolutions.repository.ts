import { EntityRepository, Repository, getConnection } from "typeorm";
import { Resolution } from "src/entities/resolution.entity";
import { ResolutionStatus } from "src/types/ElementStatus";
import { StudentUser } from "src/entities/user.entity";
import { ResolutionComment } from "src/entities/comment.entity";


@EntityRepository(Resolution)
export class ResolutionRepository extends Repository<Resolution>
{
    getResolutionStatus(resolution: Resolution): ResolutionStatus
    {
        const { startDate, deadline, resolutionDate } = resolution;
        if (resolutionDate) return ResolutionStatus.TERMINATED;
        else if (startDate && deadline < new Date(Date.now())) return ResolutionStatus.IN_PROGRESS;
        else return ResolutionStatus.OVERDUE;
    }


    async countNumberOfRejectionVotes(id: number): Promise<number>
    {
        return await getConnection().createQueryBuilder(StudentUser, "user")
                                    .innerJoinAndSelect("user.votedResolutions", "resolution")
                                    .where("resolution.id = :id", { id: id })
                                    .getCount();
    }

    async countNumberOfComments(id: number): Promise<number>
    {
        return await getConnection().createQueryBuilder(ResolutionComment, "comment")
                        .innerJoinAndSelect("comment.resolution", "resolution")
                        .where("resolution.id = :id", { id: id })
						.getCount();
    }

    async didUserVote(id: number, userId: number): Promise<boolean>
    {
        const vote = await getConnection().createQueryBuilder(StudentUser, "user")
                                            .innerJoinAndSelect("user.votedResolutions", "resolution")
                                            .where("user.id = :userId", { userId: userId })
                                            .andWhere("resolution.id = :id", { id: id })
                                            .getOne();
        return vote ? true : false;
    }
}