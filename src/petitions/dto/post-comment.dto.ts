import { IsString, Length } from "class-validator";
import { Length as LengthConstants } from '../../types/Length';

export class PostCommentDto
{
    @Length(1, LengthConstants.COMMENT)
    @IsString()
    comment: string;
}