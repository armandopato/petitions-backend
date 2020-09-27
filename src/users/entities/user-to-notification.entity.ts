import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserNotification } from "../../notifications/notification.entity";
import { User } from "./user.entity";

@Entity()
export class UserToNotification
{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.userToNotifications)
    user: User;

    @ManyToOne(() => UserNotification, notification => notification.userToNotifications)
    notification: UserNotification;

    @Column({ default: false })
    seen: boolean;
}