import { TestBed } from '@angular/core/testing';

import { SharedModelsService } from './shared-models.service';

describe('SharedModelsService', () => {
  let service: SharedModelsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedModelsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
