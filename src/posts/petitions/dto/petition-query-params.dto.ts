import { PostQueryParams } from 'src/posts/dto/post-query-params.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PetitionStatus } from '../enums/petition-status.enum';
import { PetitionOrderBy } from '../enums/petition-order-by.enum';

export class PetitionQueryParams extends PostQueryParams<PetitionOrderBy, PetitionStatus>
{
    @IsEnum(PetitionOrderBy)
    orderBy: PetitionOrderBy;
    
    @IsEnum(PetitionStatus)
    @IsOptional()
    show?: PetitionStatus;
}