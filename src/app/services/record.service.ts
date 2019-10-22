import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from './api';
import { Record } from 'app/models/record';

@Injectable()
export class RecordService {
  constructor(private api: ApiService) {}
}
