import { SchoolName } from 'src/users/enums/school-name.enum';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { LengthConstants as LengthConstants } from '../../util/length.enum';
import { FIRST_VALID_YEAR } from '../../util/constants';

export class PostQueryParams<ElementOrderBy, ElementStatus>
{
    @IsPositive()
    @IsInt()
    @Transform(val => Number(val))
    page: number;
    
    @Min(FIRST_VALID_YEAR)
    @IsInt()
    @Transform(val => Number(val))
    year: number;
    
    @IsEnum(SchoolName)
    school: SchoolName;
    
    @Length(1, LengthConstants.MAX_SEARCH)
    @IsString()
    @IsOptional()
    search?: string;
    
    // TO OVERRIDE
    orderBy: ElementOrderBy;
    show?: ElementStatus;
}
