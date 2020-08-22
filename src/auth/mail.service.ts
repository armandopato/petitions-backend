import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SES, config } from 'aws-sdk';
config.update({ region:'us-east-2' });


@Injectable()
export class MailService {

    private ses: SES;
    private genericParams: SES.SendTemplatedEmailRequest;

    constructor(private configService: ConfigService)
    {
        const sender = this.configService.get<string>("SENDER");
        const templateName = this.configService.get<string>("TEMPLATE_NAME");
        const apiVersion = this.configService.get<string>("SES_VERSION");

        this.ses = new SES({ apiVersion });
        this.genericParams = {
            Destination: { }, /* FIlled at runtime */ 
            Source: sender,
            Template: templateName,
            TemplateData: '', /* FIlled at runtime */ 
        };
    }
    
    async sendVerificationEmail(email: string, token: string): Promise<void>
    {
        const params = { ...this.genericParams };
        params.Destination = { ToAddresses: [params.Source || email] }; // Change
        params.TemplateData = `{ "token":"${token}" }`;

        await this.ses.sendTemplatedEmail(params).promise();
        
    }
}