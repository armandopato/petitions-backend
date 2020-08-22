import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, setApiKey, send as sendMail } from '@sendgrid/mail';

@Injectable()
export class MailService {

    private sender: string;
    private templateID: string;

    constructor(private configService: ConfigService)
    {
        this.sender = this.configService.get<string>("SENDER");
        this.templateID = this.configService.get<string>("TEMPLATE_ID");

        const apiKey = this.configService.get<string>("API_KEY");
        setApiKey(apiKey);
    }
    
    async sendConfirmationEmail(email: string, token: string): Promise<void>
    {
        const msg: MailDataRequired = {
            to: email,
            from: this.sender,
            templateId: this.templateID,
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
}