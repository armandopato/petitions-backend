import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenDto
{
    @ApiProperty()
    access_token: string;
}

export class AuthTokensDto extends AccessTokenDto
{
    refresh_token: string;
}
