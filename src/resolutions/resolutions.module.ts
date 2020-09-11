import { Module } from '@nestjs/common';
import { ResolutionRepository } from './resolutions.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionsService } from './resolutions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ResolutionRepository])
    ],
    providers: [ResolutionsService],
    exports: [ResolutionsService]
})
export class ResolutionsModule {}
