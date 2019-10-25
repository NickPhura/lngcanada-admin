import { TestBed } from '@angular/core/testing';

import { ExportService } from './export.service';

describe('ExportService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportService]
    });
  });

  it('should be created', () => {
    const service = TestBed.get(ExportService);

    expect(service).toBeTruthy();
  });
});
