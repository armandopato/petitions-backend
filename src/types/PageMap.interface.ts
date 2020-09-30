import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Page } from './Page';

export interface PageRepository<T, TParams> extends Repository<T>
{
	getPage(params: TParams): Promise<Page<T>>
}

export interface PageMap<T, TInfo, TParams>
{
	propertyRemover(info: TInfo): void;
	infoMapper(post: T): Promise<TInfo>;
	authInfoMapperGenerator(user: User): ((info: TInfo) => Promise<TInfo>);
	repository: PageRepository<T, TParams>;
}