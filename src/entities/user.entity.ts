import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, OneToMany, TableInheritance, ChildEntity, ManyToMany, JoinTable, JoinColumn } from "typeorm";
import { School } from "./school.entity";
import { Settings } from "./settings.entity";
import { Role } from "src/types/Role";
import { Petition } from "src/entities/petition.entity";
import { Resolution } from "src/entities/resolution.entity";
import { UserNotification } from "./notification.entity";
import { Length } from "src/types/Length";

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

    @Column({ type: "varchar", length: 200 })
    hash: string;

    @Column({ type: "varchar", length: 200 })
    salt: string;

    @Column({ type: "varchar", length: 200, nullable: true })
    confirmationToken?: string;

    @Column({ type: "varchar", length: 200, nullable: true })
    refreshToken?: string;

    @Column({ type: "varchar", length: 200, nullable: true })
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
    
    @OneToOne(() => School, { cascade: true, eager: true })
    @JoinColumn()
    school: School;

    @OneToOne(() => Settings, { cascade: true })
    @JoinColumn()
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
    myPetitions: Petition[];
}

@ChildEntity(Role.SupportTeam)
export class SupportTeamUser extends User
{
    // Resolution is the owner of the relationship
    @OneToMany(() => Resolution, resolution => resolution.by)
    myResolutions: Resolution[];
}