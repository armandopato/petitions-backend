import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsRepository } from 'src/posts/resolutions/resolutions.repository';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
    imports: [TypeOrmModule.forFeature([NotificationsRepository, ResolutionsRepository])],
    providers: [NotificationsService],
    exports: [NotificationsService],
    controllers: [NotificationsController],
})
export class NotificationsModule
{
}
