export class AccessObj
{
    access_token: string;
}

export class AuthTokens extends AccessObj
{
    refresh_token: string;
}