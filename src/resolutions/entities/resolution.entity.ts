import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Petition } from "src/petitions/entities/petition.entity";
import { ResolutionComment } from "./resolution-comment.entity";
import { SupportTeamUser, StudentUser } from "src/users/entities/user.entity";


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

    @ManyToOne(() => SupportTeamUser, user => user.resolutions)
    by: SupportTeamUser;

    @ManyToMany(() => StudentUser)
    @JoinTable()
    votedBy: StudentUser[];

    @OneToMany(() => ResolutionComment, resolutionComment => resolutionComment.resolution)
    comments: ResolutionComment[];
}