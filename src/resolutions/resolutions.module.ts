import { Module } from '@nestjs/common';
import { ResolutionRepository } from './resolutions.repository';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forFeature([ResolutionRepository])
    ]
})
export class ResolutionsModule {}
