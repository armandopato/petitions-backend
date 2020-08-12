import { Entity, ManyToOne } from "typeorm";
import { GenericComment } from "src/entities/comment.entity";
import { Resolution } from "./resolution.entity";

@Entity()
export class ResolutionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Resolution, resolution => resolution.comments)
    resolution: Resolution;
}