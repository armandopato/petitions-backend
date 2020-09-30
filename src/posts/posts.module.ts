import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PetitionsModule } from './petitions/petitions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';

@Module({
  providers: [PostsService],
  imports: [forwardRef(() => PetitionsModule), forwardRef(() => ResolutionsModule)],
  exports: [PostsService]
})
export class PostsModule {}
