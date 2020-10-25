import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { UserToNotification } from '../users/entities/user-to-notification.entity';
import { ResolutionStatus } from '../posts/resolutions/enums/resolution-status.enum';

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