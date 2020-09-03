import { SelectQueryBuilder } from "typeorm";
import { Page } from "src/types/Page";
import { NotFoundException } from "@nestjs/common";


export async function getPage<T>(query: SelectQueryBuilder<T>, page: number): Promise<Page<T>>
{
    let totalPages = await query.getCount();
	totalPages = Math.ceil(totalPages / 12);

	if (page > totalPages) throw new NotFoundException();

    const pageElements = await query.skip( (page-1) * 12)
										.take(12)
                                        .getMany();
    
    return {
        totalPages,
        pageElements
    };
}