import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Petition } from 'src/posts/petitions/petition.entity';
import { StudentUser, SupportTeamUser, User } from 'src/users/entities/user.entity';
import { ResolutionComment } from '../../comments/comment.entity';
import { Length } from 'src/util/length.enum';


@Entity()
export class Resolution
{
    @PrimaryGeneratedColumn()
    id: number;
    
    @CreateDateColumn()
    startDate: Date;

    @Column()
    deadline: Date;

    @Column({ nullable: true })
    resolutionDate?: Date;

    @Column({ type: 'varchar', length: Length.MAX_RESOLUTION_TEXT, nullable: true })
    resolutionText?: string;

    @OneToOne(() => Petition, petition => petition.resolution)
    @JoinColumn()
    petition: Petition;

    @ManyToOne(() => SupportTeamUser, user => user.myResolutions, { nullable: true })
    by?: SupportTeamUser;

    @ManyToMany(() => StudentUser, studentUser => studentUser.votedResolutions)
    @JoinTable()
    rejectionVotesBy: StudentUser[];

    @OneToMany(() => ResolutionComment, resolutionComment => resolutionComment.element)
    comments: ResolutionComment[];

    @ManyToMany(() => User, user => user.savedResolutions)
    savedBy: User[];
}