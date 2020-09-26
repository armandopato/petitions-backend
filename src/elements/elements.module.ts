import { Module } from '@nestjs/common';
import { ElementsService } from './elements.service';

@Module({
  providers: [ElementsService]
})
export class ElementsModule {}
