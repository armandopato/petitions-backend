import { SchoolType } from "src/types/School";
import { IsInt, IsPositive, IsEnum, IsOptional, Min, IsString, Length } from "class-validator";
import { PetitionStatus } from "src/types/ElementStatus";
import { OrderBy } from "src/types/OrderBy";
import { Transform } from 'class-transformer';
import { Length as LengthConstants } from '../../types/Length';

export class PetitionQueryParams
{
    @IsPositive()
    @IsInt()
    @Transform(val => Number(val))
    page: number;

    @IsEnum(OrderBy)
    orderBy: OrderBy;

    @Min(2020)
    @IsInt()
    @Transform(val => Number(val))
    year: number;

    @IsEnum(SchoolType)
    school: SchoolType;

    @IsEnum(PetitionStatus)
    @IsOptional()
    show?: PetitionStatus;

    @Length(1, LengthConstants.MAX_SEARCH)
    @IsString()
    @IsOptional()
    search?: string;
}