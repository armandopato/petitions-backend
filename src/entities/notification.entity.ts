import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, ManyToMany } from "typeorm";
import { User } from "./user.entity";
import { Resolution } from "src/entities/resolution.entity";
import { SchoolType } from "src/types/School";

@Entity()
export class UserNotification
{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany(() => User, user => user.notifications)
    users: User[];

    @Column({
        type: "enum",
        enum: SchoolType
    })
    campus: SchoolType;

    @Column({ default: false })
    seen: boolean;

    @ManyToOne(() => Resolution)
    resolution: Resolution;
}