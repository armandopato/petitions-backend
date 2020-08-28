import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, setApiKey, send as sendMail } from '@sendgrid/mail';

@Injectable()
export class MailService {

    private sender: string;
    private confirmationTemplateID: string;
    private resetTemplateID: string;

    constructor(private configService: ConfigService)
    {
        this.sender = this.configService.get<string>("SENDER");
        this.confirmationTemplateID = this.configService.get<string>("CONFIRMATION_TEMPLATE_ID");
        this.resetTemplateID = this.configService.get<string>("RESET_TEMPLATE_ID");
        const apiKey = this.configService.get<string>("API_KEY");
        setApiKey(apiKey);
    }
    
    async sendTokenEmail(email: string, token: string, templateID: string): Promise<void>
    {
        const msg: MailDataRequired = {
            to: email,
            from: this.sender,
            templateId: templateID,
            dynamicTemplateData: {
                token: token
            }
        };
        
        try
        {
            await sendMail(msg);
        }
        catch(err)
        {
            throw new InternalServerErrorException("Couldn't send confirmation email");
        }
    }

    async sendConfirmationEmail(email: string, token: string): Promise<void>
    {
        await this.sendTokenEmail(email, token, this.confirmationTemplateID);
    }


    async sendResetEmail(email: string, token: string): Promise<void>
    {
        await this.sendTokenEmail(email, token, this.resetTemplateID);
    }
}