export interface CommentInfo
{
    id: number;
    date: Date;
    text: string;
    numLikes: number;
    didLike?: boolean;
}