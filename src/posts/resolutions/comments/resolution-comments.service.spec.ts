import { Test, TestingModule } from '@nestjs/testing';
import { ResolutionCommentsService } from './resolution-comments.service';

describe('ResolutionCommentService', () => {
    let service: ResolutionCommentsService;
    
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ResolutionCommentsService],
        }).compile();
        
        service = module.get<ResolutionCommentsService>(ResolutionCommentsService);
    });
    
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
