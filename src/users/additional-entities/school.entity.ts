import { Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { SchoolType } from "src/types/School";
import { User } from "../user.entity";


@Entity()
export class School
{
    @PrimaryGeneratedColumn()
    id: number;

    @UpdateDateColumn()
    updatedDate: Date;

    @Column({
        type: "enum",
        enum: SchoolType
    })
    campus: SchoolType;

    @OneToOne(() => User, user => user.school)
    @JoinColumn()
    user: User;
}