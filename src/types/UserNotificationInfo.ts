import { NotificationType } from "./NotificationType";

export class UserNotificationInfo
{
    id: number;
    seen: boolean;
    type: NotificationType;
    resolutionId: number;
    resoutionTitle: string;
}