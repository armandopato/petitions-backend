import { IsString, Length } from "class-validator";
import { Length as LengthConstants } from '../../../types/Length';

export class CreatePetitionDto
{
    @Length(1, LengthConstants.PETITION_TITLE)
    @IsString()
    title: string;

    @Length(1, LengthConstants.PETITION_DESC)
    @IsString()
    description: string;
}