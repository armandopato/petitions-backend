import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Resolution } from "src/resolutions/resolution.entity";
import { User } from "src/users/user.entity";
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
    @ManyToOne(() => User, user => user.petitions)
    by: User;

    @ManyToMany(() => User)
    @JoinTable()
    votedBy: User[];

    @OneToMany(() => PetitionComment, petitionComment => petitionComment.petition)
    comments: PetitionComment[];
}