import { PetitionInfo, ResolutionInfo } from "./ElementInfo";
import { UserNotificationInfo } from "./UserNotificationInfo";

class ElementsCollection
{
    totalPages: number;
    currentPage: number;
}

export class PetitionsCollection extends ElementsCollection
{
    petitions: PetitionInfo[];
}

export class ResolutionsCollection extends ElementsCollection
{
    resolutions: ResolutionInfo[];
}

export class NotificationsCollection extends ElementsCollection
{
    notifications: UserNotificationInfo[];
}