import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ApiService, IRecordQueryParamSet } from './api';
import { Record } from 'app/models/record';

/**
 * Provides methods for retrieving and working with records.
 *
 * @export
 * @class RecordService
 */
@Injectable()
export class RecordService {
  constructor(private api: ApiService) {}

  /**
   * Return all records that match the provided filters.
   *
   * @param {IRecordQueryParamSet[]} queryParamSet array of query parameter sets.
   * @returns {Observable<Record[]>} total results from all query param sets. Not guaranteed to be unique.
   * @memberof RecordService
   */
  public getAll(queryParamSet: IRecordQueryParamSet[]): Observable<Record[]> {
    return of([] as Record[]);
  }

  /**
   * Get a count of all records that match the provided filters.
   *
   * @param {IRecordQueryParamSet[]} queryParamSet array of query parameter sets.
   * @returns {Observable<number>} total results from all query param sets. Not guaranteed to be unique.
   * @memberof RecordService
   */
  public getCount(queryParamSet: IRecordQueryParamSet[]): Observable<number> {
    return of(0);
  }
}
