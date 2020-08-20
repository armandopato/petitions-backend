import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    
    sendVerificationEmail(email: string, token: string): void
    {
        return;
    }
}