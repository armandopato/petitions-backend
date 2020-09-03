import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Resolution } from "src/entities/resolution.entity";
import { SchoolType } from "src/types/School";
import { NotificationType } from "src/types/NotificationType";

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

    @Column({
        type: "enum",
        enum: NotificationType
    })
    type: NotificationType;

    @OneToOne(() => Resolution)
    @JoinColumn()
    resolution: Resolution;
}