import { ResolutionStatus } from '../../posts/resolutions/enums/resolution-status.enum';

export class UserNotificationInfo
{
    id: number;
    seen: boolean;
    type: ResolutionStatus;
    resolutionId: number;
    resolutionTitle: string;
}