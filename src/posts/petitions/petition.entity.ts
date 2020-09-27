import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Resolution } from "src/posts/resolutions/resolution.entity";
import { StudentUser, User } from "src/users/entities/user.entity";
import { PetitionComment } from "../../comments/comment.entity";
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

    @OneToOne(() => Resolution, resolution => resolution.petition)
    resolution?: Resolution;

    // Owner of relationship
    @ManyToOne(() => StudentUser, user => user.myPetitions)
    by: StudentUser;

    @ManyToMany(() => StudentUser, studentUser => studentUser.votedPetitions)
    @JoinTable()
    votedBy: StudentUser[];

    @OneToMany(() => PetitionComment, petitionComment => petitionComment.element)
    comments: PetitionComment[];

    @ManyToMany(() => User, user => user.savedPetitions)
    savedBy: User[];
}