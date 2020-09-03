import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionRepository } from './petitions.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([PetitionRepository])
    ]
})
export class PetitionsModule {}
