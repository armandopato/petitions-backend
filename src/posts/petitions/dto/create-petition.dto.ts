import { IsString, Length } from 'class-validator';
import { LengthConstants as LengthConstants } from '../../../util/length.enum';

export class CreatePetitionDto
{
    @Length(LengthConstants.MIN_PETITION_TITLE, LengthConstants.MAX_PETITION_TITLE)
    @IsString()
    title: string;
    
    @Length(LengthConstants.MIN_PETITION_DESC, LengthConstants.MAX_PETITION_DESC)
    @IsString()
    description: string;
}
