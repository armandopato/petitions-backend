import { EntityRepository, Repository, getConnection } from "typeorm";
import { Resolution } from "src/entities/resolution.entity";
import { ResolutionStatus } from "src/types/ElementStatus";
import { StudentUser } from "src/entities/user.entity";
import { ResolutionComment } from "src/entities/comment.entity";
import { Petition } from "src/entities/petition.entity";
import { UserNotification } from "src/entities/notification.entity";


@EntityRepository(Resolution)
export class ResolutionRepository extends Repository<Resolution>
{
    connection = getConnection();

    determineResolutionStatus(resolution: Resolution): ResolutionStatus
    {
        const { startDate, deadline, resolutionDate } = resolution;
        if (resolutionDate) return ResolutionStatus.TERMINATED;
        else if (startDate && deadline < new Date(Date.now())) return ResolutionStatus.IN_PROGRESS;
        else return ResolutionStatus.OVERDUE;
    }


    async countNumberOfRejectionVotes(id: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(StudentUser, "user")
                                    .innerJoinAndSelect("user.votedResolutions", "resolution")
                                    .where("resolution.id = :id", { id: id })
                                    .getCount();
    }

    async countNumberOfComments(id: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(ResolutionComment, "comment")
                        .innerJoinAndSelect("comment.resolution", "resolution")
                        .where("resolution.id = :id", { id: id })
						.getCount();
    }

    async didUserVote(id: number, userId: number): Promise<boolean>
    {
        const vote = await this.connection.createQueryBuilder(StudentUser, "user")
                                            .innerJoinAndSelect("user.votedResolutions", "resolution")
                                            .where("user.id = :userId", { userId: userId })
                                            .andWhere("resolution.id = :id", { id: id })
                                            .getCount();
        return vote === 1;
    }

    async getTitle(id: number): Promise<string>
    {
        const { title } = await this.connection.createQueryBuilder(Petition, "petition")
                                                .innerJoinAndSelect("petition.resolution", "resolution")
                                                .select("petition.title", "title")
                                                .where("resolution.id = :id", { id: id })
                                                .getRawOne();
        return title;
    }


    async getIdAndTitleByNotificationId(notificationId: number): Promise<{id: number, title: string}>
    {
        const { resolutionId: id } = await this.connection.createQueryBuilder(UserNotification, "notification")
                                                .innerJoinAndSelect("notification.resolution", "resolution")
                                                .select("resolution.id", "resolutionId")
                                                .where("notification.id = :id", { id: notificationId })
                                                .getRawOne();
        
        const title = await this.getTitle(id);
        return { id, title };
    }
}