import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Petition } from "src/petitions/petition.entity";
import { User } from "src/users/user.entity";
import { ResolutionComment } from "./resolution-comment.entity";


@Entity()
export class Resolution
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    startDate: Date;

    @Column()
    deadline: Date;

    @Column()
    resolutionDate?: Date;

    @Column()
    resolutionText?: string;

    @OneToOne(() => Petition, petition => petition.resolution)
    @JoinColumn()
    petition: Petition;

    @ManyToOne(() => User, user => user.resolutions)
    by: User;

    @ManyToMany(() => User)
    @JoinTable()
    votedBy: User[];

    @OneToMany(() => ResolutionComment, resolutionComment => resolutionComment.resolution)
    comments: ResolutionComment[];
}