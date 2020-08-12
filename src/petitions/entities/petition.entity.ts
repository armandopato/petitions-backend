import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Resolution } from "src/resolutions/entities/resolution.entity";
import { StudentUser } from "src/users/entities/user.entity";
import { PetitionComment } from "./petition-comment.entity";

@Entity()
export class Petition
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @Column()
    title: string;

    @Column()
    description: string;

    @OneToOne(() => Resolution, resolution => resolution.petition, { cascade: true })
    resolution?: Resolution;

    // Owner of relationship
    @ManyToOne(() => StudentUser, user => user.petitions)
    by: StudentUser;

    @ManyToMany(() => StudentUser)
    @JoinTable()
    votedBy: StudentUser[];

    @OneToMany(() => PetitionComment, petitionComment => petitionComment.petition)
    comments: PetitionComment[];
}