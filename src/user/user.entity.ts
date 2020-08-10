import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { School } from "./additional-entities/school.entity";
import { Settings } from "./additional-entities/settings.entity";
import { Role } from "types/Role";

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
}