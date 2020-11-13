import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mailgun from 'mailgun-js';
import Mailgun from 'mailgun-js';
import SendTemplateData = Mailgun.messages.SendTemplateData;

@Injectable()
export class MailService
{
    private readonly sender: string;
    private readonly mg: mailgun.Mailgun;
    private readonly domain: string;
    
    constructor(private readonly configService: ConfigService)
    {
        this.sender = this.configService.get<string>('SENDER');
        const apiKey = this.configService.get<string>('API_KEY');
        this.domain = this.configService.get<string>('DOMAIN');
        this.mg = mailgun({ apiKey, domain: this.domain });
    }
    
    async sendTokenEmail(data: SendTemplateData): Promise<void>
    {
        try
        {
            await this.mg.messages().send(data);
        }
        catch (err)
        {
            throw new InternalServerErrorException('Couldn\'t send confirmation email');
        }
    }
    
    async sendConfirmationEmail(email: string, token: string): Promise<void>
    {
        const data: SendTemplateData = {
            from: `Peticiones UNAM <emailconfirmation@${this.domain}>`,
            to: email,
            subject: 'Confirma tu correo',
            template: 'emailconfirmation',
            'h:X-Mailgun-Variables': JSON.stringify({ token }),
        };
        await this.sendTokenEmail(data);
    }
    
    
    async sendResetEmail(email: string, token: string): Promise<void>
    {
        const data: SendTemplateData = {
            from: `Peticiones UNAM <passwordreset@${this.domain}>`,
            to: email,
            subject: 'Recupera tu contraseña',
            template: 'passwordreset',
            'h:X-Mailgun-Variables': JSON.stringify({ token }),
        };
        await this.sendTokenEmail(data);
    }
}
