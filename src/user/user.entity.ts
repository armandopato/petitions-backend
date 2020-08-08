import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { School } from "../../types/School";


@Entity()
export class User
{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdDate: Date;

    @UpdateDateColumn()
    updatedDate: Date;

    @Column()
    email: string;

    @Column()
    hash: string;

    @Column()
    salt: string;

    @Column({
        type: "enum",
        enum: School
    })
    school: School;
}