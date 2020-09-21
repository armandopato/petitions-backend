import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { Resolution } from "src/entities/resolution.entity";
import { UserToNotification } from "./user-to-notification.entity";
import { ResolutionStatus } from "src/types/ElementStatus";

@Entity()
export class UserNotification
{
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => UserToNotification, notificationRelation => notificationRelation.notification)
    userToNotifications: UserToNotification[];

    @Column({
        type: "enum",
        enum: ResolutionStatus
    })
    type: ResolutionStatus;

    @OneToOne(() => Resolution)
    @JoinColumn()
    resolution: Resolution;
}