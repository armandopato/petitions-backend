import { IsString, Length } from 'class-validator';
import { Length as LengthConstants } from '../../util/Length';

export class PostCommentDto
{
    @Length(LengthConstants.MIN_COMMENT, LengthConstants.MAX_COMMENT)
    @IsString()
    comment: string;
}