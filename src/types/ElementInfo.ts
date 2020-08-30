import { PetitionStatus, ResolutionStatus } from "./ElementStatus";

export class PetitionInfo
{
    id: number;
    title: string;
    date: Date;
    numVotes: number;
    numComments: number;
    status: PetitionStatus;
    didVote?: boolean;
    didSave?: boolean;
}

export class ResolutionInfo
{
    id: number;
    title: string;
    status: ResolutionStatus;
    startDate?: Date;
    limitDate?: Date;
    resolutionDate?: Date;
    didSave?: boolean;
}