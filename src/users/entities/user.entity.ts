import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, TableInheritance, ChildEntity } from "typeorm";
import { School } from "./school.entity";
import { Settings } from "./settings.entity";
import { Role } from "src/types/Role";
import { Petition } from "src/petitions/entities/petition.entity";
import { Resolution } from "src/resolutions/entities/resolution.entity";

@Entity()
@TableInheritance({ column: { type: 'enum', enum: Role, name: 'role' } })
export class User
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @UpdateDateColumn()
    updatedDate: Date;

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