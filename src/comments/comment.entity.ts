import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StudentUser } from 'src/users/entities/user.entity';
import { Petition } from '../posts/petitions/petition.entity';
import { Resolution } from '../posts/resolutions/resolution.entity';
import { Length } from 'src/util/Length';

export abstract class GenericComment
{
    @PrimaryGeneratedColumn()
    id: number;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @Column({ type: 'varchar', length: Length.MAX_COMMENT })
    text: string;
    
    @ManyToOne(() => StudentUser)
    by: StudentUser;
    
    abstract element;
}

@Entity()
export class PetitionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Petition, petition => petition.comments)
    element: Petition;

    @ManyToMany(() => StudentUser, user => user.likedPetitionComments, { onDelete: 'CASCADE' })
    @JoinTable()
    likedBy: StudentUser[];
}

@Entity()
export class ResolutionComment extends GenericComment
{
    // Owner of relationship
    @ManyToOne(() => Resolution, resolution => resolution.comments)
    element: Resolution;

    @ManyToMany(() => StudentUser, user => user.likedResolutionComments)
    @JoinTable()
    likedBy: StudentUser[];
}