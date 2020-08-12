import { Entity, ManyToOne } from "typeorm";
import { GenericComment } from "src/comments/comment.entity";
import { Petition } from "./petition.entity";

@Entity()
export class PetitionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Petition, petition => petition.comments)
    petition: Petition;
}