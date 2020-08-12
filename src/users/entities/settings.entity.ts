import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";


@Entity()
export class Settings
{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    notifyNewResolutions: boolean;

    @Column()
    notifyTerminatedResolutions: boolean;

    @Column()
    notifyOverdueResolutions: boolean;

    @OneToOne(() => User, user => user.settings)
    @JoinColumn()
    user: User;
}