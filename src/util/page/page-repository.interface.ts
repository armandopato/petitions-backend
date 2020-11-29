import { Repository } from 'typeorm';
import { Page } from './page.interface';

export interface PageRepository<T, TParams> extends Repository<T>
{
    getPage(params: TParams): Promise<Page<T>>;
    
    didUserSave(postId: number, userId: number): Promise<boolean>;
    
    addToSaved(postId: number, userId: number): Promise<void>;
    
    deleteFromSaved(postId: number, userId: number): Promise<void>;
    
    didUserVote(postId: number, userId: number): Promise<boolean>;
    
    vote(postId: number, userId: number): Promise<void>;
}
