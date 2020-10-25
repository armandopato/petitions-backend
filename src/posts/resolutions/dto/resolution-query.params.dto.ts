import { PostQueryParams } from 'src/posts/dto/post-query-params.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ResolutionStatus } from '../enums/resolution-status.enum';
import { ResolutionOrderBy } from '../enums/resolution-order-by.enum';

export class ResolutionQueryParams extends PostQueryParams<ResolutionOrderBy, ResolutionStatus>
{
    @IsEnum(ResolutionOrderBy)
    orderBy: ResolutionOrderBy;
    
    @IsEnum(ResolutionStatus)
    @IsOptional()
    show?: ResolutionStatus;
}