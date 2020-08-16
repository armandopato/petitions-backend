import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Resolution } from "src/entities/resolution.entity";
import { StudentUser } from "src/entities/user.entity";
import { PetitionComment } from "./comment.entity";
import { SchoolType } from "src/types/School";
import { Length } from "src/types/Length";

@Entity()
export class Petition
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @Column({
        type: "enum",
        enum: SchoolType
    })
    campus: SchoolType;

    @Column({ type: "varchar", length: Length.PETITION_TITLE })
    title: string;

    @Column({ type: "varchar", length: Length.PETITION_DESC })
    description: string;

    @OneToOne(() => Resolution, resolution => resolution.petition, { cascade: true })
    resolution?: Resolution;

    // Owner of relationship
    @ManyToOne(() => StudentUser, user => user.myPetitions)
    by: StudentUser;

    @ManyToMany(() => StudentUser)
    @JoinTable()
    votedBy: StudentUser[];

    @OneToMany(() => PetitionComment, petitionComment => petitionComment.petition)
    comments: PetitionComment[];
}