import { PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { User } from "src/users/user.entity";

export abstract class GenericComment
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @Column()
    text: string;

    @ManyToOne(() => User)
    by: User;

    @ManyToMany(() => User)
    @JoinTable()
    likedBy: User[];
}