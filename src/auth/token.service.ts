import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid/async';

@Injectable()
export class TokenService {
    
    async generateURLSafeToken(): Promise<string>
    {
        return await nanoid(50);
    }
}