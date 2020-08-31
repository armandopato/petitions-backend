import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Petition } from "src/entities/petition.entity";
import { SupportTeamUser, StudentUser, User } from "src/entities/user.entity";
import { ResolutionComment } from "./comment.entity";
import { SchoolType } from "src/types/School";
import { Length } from "src/types/Length";


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

    @Column({
        type: "enum",
        enum: SchoolType
    })
    campus: SchoolType;

    @Column({ type: "varchar", length: Length.RESOLUTION_TEXT })
    resolutionText?: string;

    @OneToOne(() => Petition, petition => petition.resolution)
    @JoinColumn()
    petition: Petition;

    @ManyToOne(() => SupportTeamUser, user => user.myResolutions)
    by: SupportTeamUser;

    @ManyToMany(() => StudentUser, studentUser => studentUser.votedResolutions)
    @JoinTable()
    rejectionVotesBy: StudentUser[];

    @OneToMany(() => ResolutionComment, resolutionComment => resolutionComment.resolution)
    comments: ResolutionComment[];

    @ManyToMany(() => User, user => user.savedResolutions)
    savedBy: User[];
}