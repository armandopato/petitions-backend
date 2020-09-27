import { Test, TestingModule } from '@nestjs/testing';
import { ResolutionsService } from './resolutions.service';

describe('ResolutionsService', () => {
  let service: ResolutionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResolutionsService],
    }).compile();

    service = module.get<ResolutionsService>(ResolutionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
