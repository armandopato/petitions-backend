import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Petition } from "src/entities/petition.entity";
import { SupportTeamUser, StudentUser } from "src/entities/user.entity";
import { ResolutionComment } from "./comment.entity";


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

    @Column({ type: "varchar", length: 500 })
    resolutionText?: string;

    @OneToOne(() => Petition, petition => petition.resolution)
    @JoinColumn()
    petition: Petition;

    @ManyToOne(() => SupportTeamUser, user => user.myResolutions)
    by: SupportTeamUser;

    @ManyToMany(() => StudentUser)
    @JoinTable()
    rejectionVotesBy: StudentUser[];

    @OneToMany(() => ResolutionComment, resolutionComment => resolutionComment.resolution)
    comments: ResolutionComment[];
}