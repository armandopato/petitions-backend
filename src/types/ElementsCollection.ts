import { PetitionInfo, ResolutionInfo } from "./ElementInfo";

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