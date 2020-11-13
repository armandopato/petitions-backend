import { Test, TestingModule } from '@nestjs/testing';
import { ResolutionsController } from './resolutions.controller';

describe('ResolutionsController', () => {
    let controller: ResolutionsController;
    
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ResolutionsController],
        }).compile();
        
        controller = module.get<ResolutionsController>(ResolutionsController);
    });
    
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
