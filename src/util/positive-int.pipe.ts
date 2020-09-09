import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Transform } from "class-transformer";
import { IsInt, IsPositive, validateSync } from "class-validator";

class PositiveInt
{
    @IsPositive()
    @IsInt()
    @Transform(val => Number(val))
    value: any;
}


@Injectable()
export class PositiveIntPipe implements PipeTransform<string, number> {
	transform(value: string): number
	{
		const num = new PositiveInt();
		num.value = value;

		if (validateSync(num).length > 0)
		{
			throw new BadRequestException();
		}
		
		return num.value;
	}
}