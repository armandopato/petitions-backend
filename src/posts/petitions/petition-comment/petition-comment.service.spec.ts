import { Test, TestingModule } from '@nestjs/testing';
import { PetitionCommentService } from './petition-comment.service';

describe('PetitionCommentService', () => {
  let service: PetitionCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetitionCommentService],
    }).compile();

    service = module.get<PetitionCommentService>(PetitionCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
