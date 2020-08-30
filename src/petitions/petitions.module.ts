import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionRepository } from './petitions.repository';
import { PetitionComment } from 'src/entities/comment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PetitionRepository, PetitionComment])
    ]
})
export class PetitionsModule {}
