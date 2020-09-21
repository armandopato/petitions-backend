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
    petitionId: number;
    startDate?: Date;
    deadline?: Date;
    resolutionDate?: Date;
    resolutionText?: string;
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