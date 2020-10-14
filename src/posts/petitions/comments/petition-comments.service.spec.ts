import { Test, TestingModule } from '@nestjs/testing';
import { PetitionCommentsService } from './petition-comments.service';

describe('PetitionCommentService', () => {
  let service: PetitionCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetitionCommentsService],
    }).compile();
  
    service = module.get<PetitionCommentsService>(PetitionCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
