import { PetitionStatus } from 'src/posts/ElementStatus';
import { PetitionOrderBy } from 'src/util/OrderBy';
import { GenericQueryParams } from 'src/posts/ElementQueryParams';
import { IsEnum, IsOptional } from 'class-validator';

export class PetitionQueryParams extends GenericQueryParams<PetitionOrderBy, PetitionStatus>
{
    @IsEnum(PetitionOrderBy)
    orderBy: PetitionOrderBy;
    
    @IsEnum(PetitionStatus)
    @IsOptional()
    show?: PetitionStatus;
}