import { EntityRepository, getConnection, Repository } from 'typeorm';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { ResolutionStatus } from 'src/types/ElementStatus';
import { StudentUser, User } from 'src/users/entities/user.entity';
import { Petition } from 'src/posts/petitions/petition.entity';
import { UserNotification } from 'src/notifications/notification.entity';
import { Page } from 'src/types/Page';
import { ResolutionQueryParams } from './dto/resolution-query.params.dto';
import { ResolutionOrderBy as OrderBy } from '../../types/OrderBy';
import { getPage } from 'src/util/getPage';
import { PageRepository } from '../../types/Post.interface';


@EntityRepository(Resolution)
export class ResolutionRepository extends Repository<Resolution> implements PageRepository<Resolution, ResolutionQueryParams>
{
    connection = getConnection();

    async getPage(params: ResolutionQueryParams): Promise<Page<Resolution>>
    {
        const { page, orderBy, year, school, show, search } = params;
        const query = this.connection.createQueryBuilder(Resolution, "resolution")
                                    .innerJoinAndSelect("resolution.petition", "petition")
                                    .where("petition.campus = :school", { school })
                                    .andWhere("date_part('year', resolution.startDate) = :year", { year });
        
        if (show)
        {
            switch(show)
            {
                case ResolutionStatus.TERMINATED:
                    query.andWhere("NOT resolution.resolutionDate IS NULL");
                    break;
                
                case ResolutionStatus.OVERDUE:
                    query.andWhere("resolution.resolutionDate IS NULL")
                        .andWhere("resolution.deadline < NOW()");
                    break;
        
                case ResolutionStatus.IN_PROGRESS:
                    query.andWhere("resolution.resolutionDate IS NULL")
                        .andWhere("resolution.deadline >= NOW()");
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
                    query.addSelect("CASE WHEN resolution.resolutionDate IS NULL AND resolution.deadline < NOW() THEN 1 ELSE 2 END", "relevance")
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
        else if (deadline >= new Date(Date.now())) return ResolutionStatus.IN_PROGRESS;
        else return ResolutionStatus.OVERDUE;
    }

    async countNumberOfRejectionVotes(id: number): Promise<number>
    {
        return await this.connection.createQueryBuilder(StudentUser, "user")
                                    .innerJoinAndSelect("user.votedResolutions", "resolution")
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

    async savePost(resolutionId: number, userId: number): Promise<void>
    {
        await this.connection.createQueryBuilder()
            .relation(Resolution, "savedBy")
            .of(resolutionId)
            .add(userId);
    }
    
    async unsavePost(resolutionId: number, userId: number): Promise<void>
    {
        await this.connection.createQueryBuilder()
            .relation(Resolution, "savedBy")
            .of(resolutionId)
            .remove(userId);
    }
    
    async voteResolution(resolutionId: number, userId: number): Promise<void>
    {
        await this.connection.createQueryBuilder()
            .relation(Resolution, "rejectionVotesBy")
            .of(resolutionId)
            .add(userId);
    }
    
    async deleteRejectionVotes(resolutionId: number): Promise<void>
    {
        await this.connection.createQueryBuilder().delete()
            .from("resolution_rejection_votes_by_user", "vote")
            .where("resolutionId = :id", { id: resolutionId })
            .execute();
    }
}