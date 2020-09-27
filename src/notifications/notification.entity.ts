import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
import { Resolution } from "src/posts/resolutions/resolution.entity";
import { UserToNotification } from "../users/entities/user-to-notification.entity";
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

    @ManyToOne(() => Resolution)
    @JoinColumn()
    resolution: Resolution;
}