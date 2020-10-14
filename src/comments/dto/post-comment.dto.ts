import { IsString, Length } from 'class-validator';
import { Length as LengthConstants } from '../../util/Length';

export class PostCommentDto
{
    @Length(1, LengthConstants.COMMENT)
    @IsString()
    comment: string;
}