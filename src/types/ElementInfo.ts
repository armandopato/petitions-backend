import { PetitionStatus, ResolutionStatus } from "./ElementStatus";

export class PetitionInfo
{
    id: number;
    title: string;
    date: Date;
    numVotes: number;
    numComments: number;
    status: PetitionStatus;
    description?: string;
    didVote?: boolean;
    didSave?: boolean;
}

export class ResolutionInfo
{
    id: number;
    title: string;
    status: ResolutionStatus;
    startDate?: Date;
    deadline?: Date;
    resolutionDate?: Date;
    numRejectionVotes?: number;
    numComments?: number;
    didSave?: boolean;
    didVote?: boolean;
}

export class CommentInfo
{
    id: number;
    date: Date;
    text: string;
    numLikes: number;
    didLike?: boolean;
}