import { ResolutionStatus } from "src/types/ElementStatus";
import { ResolutionOrderBy } from "src/types/OrderBy";
import { GenericQueryParams } from "src/types/ElementQueryParams";
import { IsEnum, IsOptional } from "class-validator";

export class ResolutionQueryParams extends GenericQueryParams<ResolutionOrderBy, ResolutionStatus>
{
    @IsEnum(ResolutionOrderBy)
    orderBy: ResolutionOrderBy;

    @IsEnum(ResolutionStatus)
    @IsOptional()
    show?: ResolutionStatus;
}