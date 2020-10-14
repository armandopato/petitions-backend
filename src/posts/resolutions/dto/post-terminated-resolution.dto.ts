import { IsInt, IsPositive, IsString, Length } from 'class-validator';
import { Length as LengthConstants } from '../../../util/Length';

export class PostTerminatedResolutionDto
{
    @IsPositive()
    @IsInt()
    petitionId: number;
    
    @Length(1, LengthConstants.RESOLUTION_TEXT)
    @IsString()
    resolutionText: string;
}