import { Module } from '@nestjs/common';
import { ResolutionRepository } from './resolutions.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsService } from './resolutions.service';
import { ResolutionsController } from './resolutions.controller';
import { PetitionRepository } from 'src/petitions/petitions.repository';
import { SchedulingModule } from 'src/scheduling/scheduling.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ResolutionRepository, PetitionRepository]),
        SchedulingModule,
        NotificationsModule,
        CommentsModule
    ],
    providers: [ResolutionsService],
    exports: [ResolutionsService],
    controllers: [ResolutionsController]
})
export class ResolutionsModule {}
