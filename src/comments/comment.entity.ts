import { PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { StudentUser } from "src/users/entities/user.entity";

export abstract class GenericComment
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @Column()
    text: string;

    @ManyToOne(() => StudentUser)
    by: StudentUser;

    @ManyToMany(() => StudentUser)
    @JoinTable()
    likedBy: StudentUser[];
}