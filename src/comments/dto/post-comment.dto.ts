import { IsString, Length } from 'class-validator';
import { Length as LengthConstants } from '../../util/length.enum';

export class PostCommentDto
{
    @Length(LengthConstants.MIN_COMMENT, LengthConstants.MAX_COMMENT)
    @IsString()
    comment: string;
}