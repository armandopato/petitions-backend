import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Resolution } from 'src/posts/resolutions/resolution.entity';
import { StudentUser, User } from 'src/users/entities/user.entity';
import { PetitionComment } from '../../comments/comment.entity';
import { SchoolName } from 'src/users/enums/school-name.enum';
import { Length } from 'src/util/length.enum';

@Entity()
export class Petition
{
    @PrimaryGeneratedColumn()
    id: number;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @Column({
        type: 'enum',
        enum: SchoolName,
    })
    campus: SchoolName;
    
    @Column({ type: 'varchar', length: Length.MAX_PETITION_TITLE })
    title: string;
    
    @Column({ type: 'varchar', length: Length.MAX_PETITION_DESC })
    description: string;
    
    @OneToOne(() => Resolution, resolution => resolution.petition)
    resolution?: Resolution;
    
    // Owner of relationship
    @ManyToOne(() => StudentUser, user => user.myPetitions)
    by: StudentUser;
    
    @ManyToMany(() => StudentUser, studentUser => studentUser.votedPetitions)
    @JoinTable()
    votedBy: StudentUser[];
    
    @OneToMany(() => PetitionComment, petitionComment => petitionComment.element)
    comments: PetitionComment[];
    
    @ManyToMany(() => User, user => user.savedPetitions)
    savedBy: User[];
}
