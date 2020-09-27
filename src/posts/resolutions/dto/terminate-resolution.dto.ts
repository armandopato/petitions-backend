import { IsString, Length } from "class-validator";
import { Length as LengthConstants } from '../../../types/Length';

export class ResolutionTextDto
{
	@Length(1, LengthConstants.RESOLUTION_TEXT)
	@IsString()
	resolutionText: string;
}