import { IsInt, IsPositive, IsString, Length } from 'class-validator';
import { LengthConstants as LengthConstants } from '../../../util/length.enum';

export class PostTerminatedResolutionDto
{
    @IsPositive()
    @IsInt()
    petitionId: number;
    
    @Length(LengthConstants.MIN_RESOLUTION_TEXT, LengthConstants.MAX_RESOLUTION_TEXT)
    @IsString()
    resolutionText: string;
}
