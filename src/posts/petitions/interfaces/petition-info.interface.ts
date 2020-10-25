import { PetitionStatus } from '../enums/petition-status.enum';

export interface PetitionInfo
{
    id: number;
    title: string;
    date: Date;
    numVotes: number;
    numComments: number;
    status: PetitionStatus;
    resolutionId?: number;
    description?: string;
    didVote?: boolean;
    didSave?: boolean;
}