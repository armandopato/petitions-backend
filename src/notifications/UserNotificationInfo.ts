import { ResolutionStatus } from '../posts/ElementStatus';

export class UserNotificationInfo
{
    id: number;
    seen: boolean;
    type: ResolutionStatus;
    resolutionId: number;
    resolutionTitle: string;
}