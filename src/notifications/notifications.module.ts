import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsRepository } from 'src/posts/resolutions/resolutions.repository';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationsRepository, ResolutionsRepository])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
