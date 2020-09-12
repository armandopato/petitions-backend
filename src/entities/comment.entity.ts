import { PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, ManyToMany, JoinTable, Entity } from "typeorm";
import { StudentUser } from "src/entities/user.entity";
import { Petition } from "./petition.entity";
import { Resolution } from "./resolution.entity";
import { Length } from "src/types/Length";

export abstract class GenericComment
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @Column({ type: "varchar", length: Length.COMMENT })
    text: string;

    @ManyToOne(() => StudentUser)
    by: StudentUser;
}

@Entity()
export class PetitionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Petition, petition => petition.comments)
    petition: Petition;

    @ManyToMany(() => StudentUser, user => user.likedPetitionComments)
    @JoinTable()
    likedBy: StudentUser[];
}

@Entity()
export class ResolutionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Resolution, resolution => resolution.comments)
    resolution: Resolution;

    @ManyToMany(() => StudentUser, user => user.likedResolutionComments)
    @JoinTable()
    likedBy: StudentUser[];
}