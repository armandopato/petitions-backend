import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from "typeorm";
import { School } from "./additional-entities/school.entity";
import { Settings } from "./additional-entities/settings.entity";
import { Role } from "src/types/Role";
import { Petition } from "src/petitions/petition.entity";
import { Resolution } from "src/resolutions/resolution.entity";

@Entity()
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

    @Column()
    role: Role;
    
    @OneToOne(() => School, school => school.user, { cascade: true })
    school: School;

    @OneToOne(() => Settings, settings => settings.user, { cascade: true })
    settings: Settings;

    // Petition is the owner of the relationship
    @OneToMany(() => Petition, petition => petition.by)
    petitions: Petition[];

    // Resolution is the owner of the relationship
    @OneToMany(() => Resolution, resolution => resolution.by)
    resolutions: Resolution[];
}