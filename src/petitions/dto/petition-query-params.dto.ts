import { PetitionStatus } from "src/types/ElementStatus";
import { PetitionOrderBy } from "src/types/OrderBy";
import { GenericQueryParams } from "src/types/ElementQueryParams";
import { IsEnum, IsOptional } from "class-validator";

export class PetitionQueryParams extends GenericQueryParams<PetitionOrderBy, PetitionStatus>
{
    @IsEnum(PetitionOrderBy)
    orderBy: PetitionOrderBy;

    @IsEnum(PetitionStatus)
    @IsOptional()
    show?: PetitionStatus;
}