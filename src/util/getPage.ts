import { SelectQueryBuilder } from 'typeorm';
import { Page } from 'src/util/Page';
import { NotFoundException } from '@nestjs/common';
import { PAGE_SIZE } from './Constants';


export async function getPage<T>(query: SelectQueryBuilder<T>, page: number): Promise<Page<T>>
{
    let totalPages = await query.getCount();
    totalPages = Math.ceil(totalPages / PAGE_SIZE);
    
    if (page > totalPages) throw new NotFoundException();
    
    const pageElements = await query.skip((page - 1) * PAGE_SIZE)
        .take(PAGE_SIZE)
        .getMany();
    
    return {
        totalPages,
        pageElements,
    };
}