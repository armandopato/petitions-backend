import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, OneToMany, TableInheritance, ChildEntity, ManyToMany, JoinTable } from "typeorm";
import { School } from "./school.entity";
import { Settings } from "./settings.entity";
import { Role } from "src/types/Role";
import { Petition } from "src/entities/petition.entity";
import { Resolution } from "src/entities/resolution.entity";
import { UserNotification } from "./notification.entity";

@Entity()
@TableInheritance({ column: { type: 'enum', enum: Role, name: 'role' } })
export class User
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @Column()
    email: string;

    @Column()
    hash: string;

    @Column()
    salt: string;

    @Column()
    confirmationToken?: string;

    @Column()
    resetToken?: string;

    @Column({
        type: "enum",
        enum: Role
    })
    role: Role;

    @Column( { default: false } )
    hasModeratorPrivileges: boolean;

    @Column( { default: false } )
    hasAdminPrivileges: boolean;
    
    @OneToOne(() => School, school => school.user, { cascade: true })
    school: School;

    @OneToOne(() => Settings, settings => settings.user, { cascade: true })
    settings: Settings;

    @ManyToMany(() => UserNotification, notification => notification.users)
    @JoinTable()
    notifications: UserNotification[];

    @ManyToMany(() => Petition)
    @JoinTable()
    savedPetitions: Petition[];

    @ManyToMany(() => Resolution)
    @JoinTable()
    savedResolutions: Resolution[];
}

@ChildEntity(Role.Student)
export class StudentUser extends User
{
    // Petition is the owner of the relationship
    @OneToMany(() => Petition, petition => petition.by)
    petitions: Petition[];
}

@ChildEntity(Role.SupportTeam)
export class SupportTeamUser extends User
{
    // Resolution is the owner of the relationship
    @OneToMany(() => Resolution, resolution => resolution.by)
    resolutions: Resolution[];
}