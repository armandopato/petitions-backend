import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SchoolName } from 'src/users/enums/school-name.enum';

@Entity()
export class School
{
    @PrimaryGeneratedColumn()
    id: number;
    
    @UpdateDateColumn()
    updatedDate: Date;
    
    @Column({
        type: 'enum',
        enum: SchoolName,
    })
    campus: SchoolName;
}