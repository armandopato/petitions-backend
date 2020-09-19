import { EntityRepository, Repository, getConnection } from "typeorm";
import { Resolution } from "src/entities/resolution.entity";
import { ResolutionStatus } from "src/types/ElementStatus";
import { StudentUser, User } from "src/entities/user.entity";
import { ResolutionComment } from "src/entities/comment.entity";
import { Petition } from "src/entities/petition.entity";
import { UserNotification } from "src/entities/notification.entity";
import { Page } from "src/types/Page";
import { ResolutionQueryParams } from "./dto/resolution-query.params.dto";
import { ResolutionInfo } from "src/types/ElementInfo";
import { ResolutionOrderBy as OrderBy } from '../types/OrderBy';
import { getPage } from "src/util/getPage";


@EntityRepository(Resolution)
export class ResolutionRepository extends Repository<Resolution>
{
    connection = getConnection();

    async getResolutionsPage(params: ResolutionQueryParams): Promise<Page<Resolution>>
    {
        const { page, orderBy, year, school, show, search } = params;
        const query = this.connection.createQueryBuilder(Resolution, "resolution")
                                    .where("resolution.campus = :school", { school })
                                    .andWhere("date_part('year', resolution.startDate) = :year", { year });
        
        if (show)
        {
            switch(show)
            {
                case ResolutionStatus.TERMINATED:
                    query.andWhere("NOT resolution.resolutionDate = null");
                    break;
                
                case ResolutionStatus.OVERDUE:
                    query.andWhere("resolution.resolutionDate = null")
                        .andWhere("resolution.deadline > NOW()");
                    break;
        
                case ResolutionStatus.IN_PROGRESS:
                    query.andWhere("resolution.resolutionDate = null")
                        .andWhere("resolution.deadline <= NOW()");
                    break;
            }
        }

        if (search)
        {
            query.leftJoin("resolution.petition", "petition")
                .andWhere("petition.title LIKE :search", { search: `%${search}%` })
                .andWhere("resolution.resolutionText LIKE :search", { search: `%${search}%` });
        }

        switch(orderBy)
        {
            case OrderBy.MOST_RECENT:
                query.orderBy("resolution.id", "DESC");
                break;
            
            case OrderBy.OLDEST:
                query.orderBy("resolution.id", "ASC");
                break;

            case OrderBy.RELEVANCE:
                if (!show)
                {
                    query.addSelect("CASE WHEN resolution.resolutionDate = null AND resolution.deadline > NOW() THEN 1 ELSE 2 END", "relevance")
                        .orderBy("relevance", "ASC");
                }
                query.addOrderBy("resolution.id", "DESC");
                break;
        }
        return await getPage(query, page);
    }

    getResolutionStatus(resolution: Resolution): ResolutionStatus
    {
        const { deadline, resolutionDate } = resolution;
        if (resolutionDate) return ResolutionStatus.TERMINATED;
        else if (deadline < new Date(Date.now())) return ResolutionStatus.IN_PROGRESS;
        else return ResolutionStatus.OVERDUE;
    }

    async getResolutionInfo(resolution: Resolution): Promise<ResolutionInfo>
    {
        const resolutionInfo: ResolutionInfo = {
            id: resolution.id,
            title: await this.getTitle(resolution.id),
            status: this.getResolutionStatus(resolution)
        };

        if (resolutionInfo.status === ResolutionStatus.TERMINATED)
        {
            resolutionInfo.numRejectionVotes = await this.countNumberOfRejectionVotes(resolution.id),
            resolutionInfo.resolutionDate = resolution.resolutionDate;
            resolutionInfo.numComments = await this.countNumberOfComments(resolution.id);
        }
        else
        {
            resolutionInfo.startDate = resolution.startDate;
            resolutionInfo.deadline = resolution.deadline;
        }

        return resolutionInfo;
    }

    async getAuthResolutionInfo(resolution: Resolution, user: User): Promise<ResolutionInfo>
    {
        const resolutionInfo = await this.getResolutionInfo(resolution);
        if (resolutionInfo.status === ResolutionStatus.TERMINATED)
        {
            resolutionInfo.didVote = await this.didUserVote(resolution.id, user.id);
        }
        resolutionInfo.didSave = await this.didUserSave(resolution.id, user.id);
        return resolutionInfo;
    }

    async mapResolutionsToResolutionsInfo(resolutions: Resolution[]): Promise<ResolutionInfo[]>
    {
        const resolutionsInfoArr: ResolutionInfo[] = [];

        for (const resolution of resolutions)
        {
            const resolutionInfo = await this.getResolutionInfo(resolution);
            resolutionsInfoArr.push(resolutionInfo);
        }

        return resolutionsInfoArr;
    }

    async mapResolutionsToAuthResolutionsInfo(resolutions: Resolution[], user: User): Promise<ResolutionInfo[]>
    {
        const authResolutionsInfoArr: ResolutionInfo[] = [];

        for (const resolution of resolutions)
        {
            const authResolutionInfo = await this.getAuthResolutionInfo(resolution, user);
            authResolutionsInfoArr.push(authResolutionInfo);
        }

        return authResolutionsInfoArr;
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

    async didUserSave(id: number, userId: number): Promise<boolean>
    {
        const saved = await this.connection.createQueryBuilder(User, "user")
                                            .innerJoinAndSelect("user.savedResolutions", "resolution")
                                            .where("user.id = :userId", { userId: userId })
                                            .andWhere("resolution.id = :id", { id: id })
                                            .getCount();
        return saved === 1;
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