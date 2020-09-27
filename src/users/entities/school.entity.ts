import { Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column } from "typeorm";
import { SchoolType } from "src/types/School";

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
}