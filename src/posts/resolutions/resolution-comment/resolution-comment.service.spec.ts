import { Test, TestingModule } from '@nestjs/testing';
import { ResolutionCommentService } from './resolution-comment.service';

describe('ResolutionCommentService', () => {
  let service: ResolutionCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResolutionCommentService],
    }).compile();

    service = module.get<ResolutionCommentService>(ResolutionCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
