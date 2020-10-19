import { IsString, Length } from 'class-validator';
import { Length as LengthConstants } from '../../../util/Length';

export class CreatePetitionDto
{
    @Length(LengthConstants.MIN_PETITION_TITLE, LengthConstants.MAX_PETITION_TITLE)
    @IsString()
    title: string;
    
    @Length(LengthConstants.MIN_PETITION_DESC, LengthConstants.MAX_PETITION_DESC)
    @IsString()
    description: string;
}