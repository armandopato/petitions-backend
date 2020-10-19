import {
    ChildEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    TableInheritance,
} from 'typeorm';
import { School } from './school.entity';
import { Settings } from './settings.entity';
import { Role } from 'src/users/Role';
import { Petition } from 'src/posts/petitions/petition.entity';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { Length } from 'src/util/Length';
import { PetitionComment, ResolutionComment } from '../../comments/comment.entity';
import { UserToNotification } from './user-to-notification.entity';

@Entity()
@TableInheritance({ column: { type: 'enum', enum: Role, name: 'role' } })
export class User
{
    @PrimaryGeneratedColumn()
    id: number;
    
    @CreateDateColumn()
    createdDate: Date;

    @Column({ type: "varchar", length: Length.EMAIL, unique: true })
    email: string;

    @Column({ type: 'varchar', length: Length.HASH_LENGTH })
    password: string;

    @Column({ default: false })
    active: boolean;

    @Column({
        type: "enum",
        enum: Role
    })
    role: Role;

    @Column( { default: false } )
    hasModeratorPrivileges: boolean;

    @Column( { default: false } )
    hasAdminPrivileges: boolean;
    
    @OneToOne(() => School, { cascade: true, eager: true })
    @JoinColumn()
    school: School;

    @OneToOne(() => Settings, { cascade: true, eager: true })
    @JoinColumn()
    settings: Settings;

    @OneToMany(() => UserToNotification, notificationRelation => notificationRelation.user)
    userToNotifications: UserToNotification[];

    @ManyToMany(() => Petition, petition => petition.savedBy)
    @JoinTable()
    savedPetitions: Petition[];

    @ManyToMany(() => Resolution, resolution => resolution.savedBy)
    @JoinTable()
    savedResolutions: Resolution[];
}

@ChildEntity(Role.Student)
export class StudentUser extends User
{
    // Petition is the owner of the relationship
    @OneToMany(() => Petition, petition => petition.by)
    myPetitions: Petition[];

    @ManyToMany(() => Petition, petition => petition.votedBy)
    votedPetitions: Petition[];

    @ManyToMany(() => Resolution, resolution => resolution.rejectionVotesBy)
    votedResolutions: Resolution[];

    @ManyToMany(() => PetitionComment, comment => comment.likedBy)
    likedPetitionComments: PetitionComment[];

    @ManyToMany(() => ResolutionComment, comment => comment.likedBy)
    likedResolutionComments: ResolutionComment[];
}

@ChildEntity(Role.SupportTeam)
export class SupportTeamUser extends User
{
    // Resolution is the owner of the relationship
    @OneToMany(() => Resolution, resolution => resolution.by)
    myResolutions: Resolution[];
}