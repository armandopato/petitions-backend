import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Page } from './Page';

export interface PageRepository<T, TParams> extends Repository<T>
{
	getPage(params: TParams): Promise<Page<T>>
}

export interface Post<T, TInfo, TParams>
{
	repository: PageRepository<T, TParams>;
	
	getInfoById(postId: number, user: User): Promise<TInfo>;
	
	getInfoPage(params: TParams, user: User): Promise<Page<TInfo>>;
	
	saveOrUnsave(postId: number, user: User): Promise<void>;
	
	propertyRemover(info: TInfo): void;
	
	infoMapper(post: T): Promise<TInfo>;
	
	authInfoMapperGenerator(user: User): ((info: TInfo) => Promise<TInfo>);
}