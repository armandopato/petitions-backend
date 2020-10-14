import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SchoolType } from 'src/users/School';

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