import { ResolutionStatus } from "./ElementStatus";

export class UserNotificationInfo
{
    id: number;
    seen: boolean;
    type: ResolutionStatus;
    resolutionId: number;
    resoutionTitle: string;
}