import { IsString, Length } from 'class-validator';
import { LengthConstants as LengthConstants } from '../../util/length.enum';

export class CreateCommentDto
{
    @Length(LengthConstants.MIN_COMMENT, LengthConstants.MAX_COMMENT)
    @IsString()
    comment: string;
}
