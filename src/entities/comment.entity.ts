import { PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, ManyToMany, JoinTable, Entity } from "typeorm";
import { StudentUser } from "src/entities/user.entity";
import { Petition } from "./petition.entity";
import { Resolution } from "./resolution.entity";

abstract class GenericComment
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @Column()
    text: string;

    @ManyToOne(() => StudentUser)
    by: StudentUser;

    @ManyToMany(() => StudentUser)
    @JoinTable()
    likedBy: StudentUser[];
}

@Entity()
export class PetitionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Petition, petition => petition.comments)
    petition: Petition;
}

@Entity()
export class ResolutionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Resolution, resolution => resolution.comments)
    resolution: Resolution;
}