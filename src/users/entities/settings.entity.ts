import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Settings
{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: true })
    notifyNewResolutions: boolean;

    @Column({ default: true })
    notifyTerminatedResolutions: boolean;

    @Column({ default: true })
    notifyOverdueResolutions: boolean;
}