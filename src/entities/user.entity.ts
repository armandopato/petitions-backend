import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, OneToMany, TableInheritance, ChildEntity, ManyToMany, JoinTable, JoinColumn } from "typeorm";
import { School } from "./school.entity";
import { Settings } from "./settings.entity";
import { Role } from "src/types/Role";
import { Petition } from "src/entities/petition.entity";
import { Resolution } from "src/entities/resolution.entity";
import { UserNotification } from "./notification.entity";
import { Length } from "src/types/Length";
import { PetitionComment, ResolutionComment } from "./comment.entity";

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

    @Column({ type: "varchar", length: 60 })
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

    @ManyToMany(() => UserNotification, notification => notification.users)
    @JoinTable()
    notifications: UserNotification[];

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