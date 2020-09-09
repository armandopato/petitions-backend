import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetitionRepository } from './petitions.repository';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PetitionRepository])
    ],
    controllers: [PetitionsController],
    providers: [PetitionsService]
})
export class PetitionsModule {}
