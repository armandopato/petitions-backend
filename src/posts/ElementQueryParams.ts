import { SchoolType } from 'src/users/School';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { Length as LengthConstants } from '../util/Length';

export class GenericQueryParams<ElementOrderBy, ElementStatus>
{
    @IsPositive()
    @IsInt()
    @Transform(val => Number(val))
    page: number;
    
    @Min(2020)
    @IsInt()
    @Transform(val => Number(val))
    year: number;
    
    @IsEnum(SchoolType)
    school: SchoolType;

    @Length(1, LengthConstants.MAX_SEARCH)
    @IsString()
    @IsOptional()
    search?: string;

    // TO OVERRIDE
    orderBy: ElementOrderBy;
    show?: ElementStatus;
}