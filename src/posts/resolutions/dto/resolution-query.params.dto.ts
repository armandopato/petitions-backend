import { ResolutionStatus } from 'src/posts/ElementStatus';
import { ResolutionOrderBy } from 'src/util/OrderBy';
import { GenericQueryParams } from 'src/posts/ElementQueryParams';
import { IsEnum, IsOptional } from 'class-validator';

export class ResolutionQueryParams extends GenericQueryParams<ResolutionOrderBy, ResolutionStatus>
{
    @IsEnum(ResolutionOrderBy)
    orderBy: ResolutionOrderBy;
    
    @IsEnum(ResolutionStatus)
    @IsOptional()
    show?: ResolutionStatus;
}