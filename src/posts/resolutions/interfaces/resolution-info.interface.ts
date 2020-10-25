import { ResolutionStatus } from '../enums/resolution-status.enum';

export interface ResolutionInfo
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