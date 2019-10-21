import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { Document } from 'app/models/document';

/**
 * Supported query param field modifiers used by the api to interpret the query param value.
 *
 * @export
 * @enum {number}
 */
export enum QueryParamModifier {
  Equal = 'eq', // value must be equal to this, for multiple values must match at least one
  Not_Equal = 'ne', // value must not be equal to this, for multiple values must not match any
  Since = 'since', // date must be on or after this date
  Until = 'until', // date must be before this date
  Text = 'text' // value must exist in any text indexed fields.
}

/**
 * A complete set of query param fields used to make a single call to the api.
 *
 * Note: this can contain multiple properties as long as the keys are strings and the values are IQueryParamValue.
 *
 * @export
 * @interface IQueryParamSet
 */
export interface IQueryParamSet {
  [key: string]: IQueryParamValue<any>;
}

/**
 * A single query param field with optional modifier.
 *
 * @export
 * @interface IQueryParamValue
 * @template T
 */
export interface IQueryParamValue<T> {
  value: T;
  modifier?: QueryParamModifier;
}

/**
 * Supported query parameters for application requests.
 *
 * Note: all parameters are optional.
 *
 * @export
 * @interface IRecordQueryParamSet
 */
export interface IRecordQueryParamSet {
  pageNum?: number;
  pageSize?: number;
  sortBy?: string;

  isDeleted?: boolean;

  agency?: IQueryParamValue<string>;
  areaHectares?: IQueryParamValue<string>;
  businessUnit?: IQueryParamValue<string>;
  centroid?: IQueryParamValue<string>;
  cl_file?: IQueryParamValue<number>;
  client?: IQueryParamValue<string>;
  cpEnd?: IQueryParamValue<Date>;
  cpStart?: IQueryParamValue<Date>;
  publishDate?: IQueryParamValue<Date>;
  purpose?: IQueryParamValue<string[]>;
  reason?: IQueryParamValue<string[]>;
  status?: IQueryParamValue<string[]>;
  statusHistoryEffectiveDate?: IQueryParamValue<Date>;
  subpurpose?: IQueryParamValue<string[]>;
  subtype?: IQueryParamValue<string>;
  tantalisID?: IQueryParamValue<number>;
  tenureStage?: IQueryParamValue<string>;
}

@Injectable()
export class ApiService {
  public token: string;
  public isMS: boolean; // IE, Edge, etc
  // private jwtHelper: JwtHelperService;
  pathAPI: string;
  // params: Params;
  env: 'local' | 'dev' | 'test' | 'master' | 'prod';

  constructor(private http: HttpClient) {
    // this.jwtHelper = new JwtHelperService();
    const currentUser = JSON.parse(window.localStorage.getItem('currentUser'));
    this.token = currentUser && currentUser.token;
    this.isMS = window.navigator.msSaveOrOpenBlob ? true : false;

    const { hostname } = window.location;
    switch (hostname) {
      case 'localhost':
        // Local
        this.pathAPI = 'http://localhost:3000/api';
        this.env = 'local';
        break;

      case 'nrpti-dev.pathfinder.gov.bc.ca':
        // Dev
        this.pathAPI = 'https://nrpti-dev.pathfinder.gov.bc.ca/api';
        this.env = 'dev';
        break;

      case 'nrpti-master.pathfinder.gov.bc.ca':
        // Master
        this.pathAPI = 'https://nrpti-master.pathfinder.gov.bc.ca/api';
        this.env = 'master';
        break;

      case 'nrpti-test.pathfinder.gov.bc.ca':
        // Test
        this.pathAPI = 'https://nrpti-test.pathfinder.gov.bc.ca/api';
        this.env = 'test';
        break;

      default:
        // Prod
        this.pathAPI = 'https://nrpti.nrs.gov.bc.ca/api';
        this.env = 'prod';
    }
  }

  handleError(error: any): Observable<never> {
    const reason = error.message
      ? error.error
        ? `${error.message} - ${error.error.message}`
        : error.message
      : error.status
      ? `${error.status} - ${error.statusText}`
      : 'Server error';
    console.log('API error =', reason);
    return throwError(error);
  }

  //
  // Documents
  //

  // NB: returns array with 1 element
  getDocument(id: string): Observable<Document[]> {
    const queryString = `document/${id}`;
    return this.http.get<Document[]>(`${this.pathAPI}/${queryString}`, {});
  }

  deleteDocument(doc: Document): Observable<Document> {
    const queryString = `document/${doc._id}`;
    return this.http.delete<Document>(`${this.pathAPI}/${queryString}`, {});
  }

  publishDocument(doc: Document): Observable<Document> {
    const queryString = `document/${doc._id}/publish`;
    return this.http.put<Document>(`${this.pathAPI}/${queryString}`, doc, {});
  }

  unPublishDocument(doc: Document): Observable<Document> {
    const queryString = `document/${doc._id}/unpublish`;
    return this.http.put<Document>(`${this.pathAPI}/${queryString}`, doc, {});
  }

  uploadDocument(formData: FormData): Observable<Document> {
    const fields = ['documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document/?fields=${this.convertArrayIntoPipeString(fields)}`;
    return this.http.post<Document>(`${this.pathAPI}/${queryString}`, formData, {});
  }

  private downloadResource(id: string): Promise<Blob> {
    const queryString = `document/${id}/download`;
    return this.http.get<Blob>(this.pathAPI + '/' + queryString, { responseType: 'blob' as 'json' }).toPromise();
  }

  public async downloadDocument(document: Document): Promise<void> {
    const blob = await this.downloadResource(document._id);
    const filename = document.documentFileName;

    if (this.isMS) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      window.document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  }

  public async openDocument(document: Document): Promise<void> {
    const blob = await this.downloadResource(document._id);
    const filename = document.documentFileName;

    if (this.isMS) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const tab = window.open();
      const fileURL = URL.createObjectURL(blob);
      tab.location.href = fileURL;
    }
  }

  /**
   * Converts an array of strings into a single string whose values are separated by a pipe '|' symbol.
   *
   * Example: ['bird','dog','cat'] -> 'bird|dog|cat'
   *
   * @private
   * @param {string[]} collection
   * @returns {string}
   * @memberof ApiService
   */
  public convertArrayIntoPipeString(collection: string[]): string {
    if (!collection || collection.length <= 0) {
      return '';
    }

    return collection.join('|');
  }

  /**
   * Checks each application query parameter of the given queryParams and builds a single query string.
   *
   * @param {IRecordQueryParamSet} queryParams
   * @returns {string}
   * @memberof ApiService
   */
  public buildApplicationQueryParametersString(params: IRecordQueryParamSet): string {
    if (!params) {
      return '';
    }

    let queryString = '';

    if ([true, false].includes(params.isDeleted)) {
      queryString += `isDeleted=${params.isDeleted}&`;
    }

    if (params.sortBy) {
      queryString += `sortBy=${params.sortBy}&`;
    }

    if (params.pageNum >= 0) {
      queryString += `pageNum=${params.pageNum}&`;
    }

    if (params.pageSize >= 0) {
      queryString += `pageSize=${params.pageSize}&`;
    }

    if (params.cpStart && params.cpStart.value) {
      queryString += `cpStart=${params.cpStart.value.toISOString()}&`;
    }

    if (params.cpEnd && params.cpEnd.value) {
      queryString += `cpEnd=${params.cpEnd.value.toISOString()}&`;
    }

    if (params.tantalisID && params.tantalisID.value >= 0) {
      queryString += `tantalisID=${params.tantalisID.value}&`;
    }

    if (params.cl_file && params.cl_file.value >= 0) {
      queryString += `cl_file=${params.cl_file.value}&`;
    }

    if (params.purpose && params.purpose.value && params.purpose.value.length) {
      params.purpose.value.forEach((purpose: string) => (queryString += `purpose[eq]=${encodeURIComponent(purpose)}&`));
    }

    if (params.subpurpose && params.subpurpose.value && params.subpurpose.value.length) {
      params.subpurpose.value.forEach(
        (subpurpose: string) => (queryString += `subpurpose[eq]=${encodeURIComponent(subpurpose)}&`)
      );
    }

    if (params.status && params.status.value && params.status.value.length) {
      params.status.value.forEach((status: string) => (queryString += `status[eq]=${encodeURIComponent(status)}&`));
    }

    if (params.reason && params.reason.value && params.reason.value.length) {
      params.reason.value.forEach(
        (reason: string) => (queryString += `reason[${params.reason.modifier}]=${encodeURIComponent(reason)}&`)
      );
    }

    if (params.subtype && params.subtype.value) {
      queryString += `subtype=${encodeURIComponent(params.subtype.value)}&`;
    }

    if (params.agency && params.agency.value) {
      queryString += `agency=${encodeURIComponent(params.agency.value)}&`;
    }

    if (params.businessUnit && params.businessUnit.value) {
      queryString += `businessUnit[eq]=${encodeURIComponent(params.businessUnit.value)}&`;
    }

    if (params.client && params.client.value) {
      queryString += `client[${params.client.modifier}]=${encodeURIComponent(params.client.value)}&`;
    }

    if (params.tenureStage && params.tenureStage.value) {
      queryString += `tenureStage=${encodeURIComponent(params.tenureStage.value)}&`;
    }

    if (params.areaHectares && params.areaHectares.value) {
      queryString += `areaHectares=${encodeURIComponent(params.areaHectares.value)}&`;
    }

    if (params.statusHistoryEffectiveDate && params.statusHistoryEffectiveDate.value) {
      queryString += `statusHistoryEffectiveDate=${params.statusHistoryEffectiveDate.value.toISOString()}&`;
    }

    if (params.centroid && params.centroid.value) {
      queryString += `centroid=${params.centroid.value}&`;
    }

    if (params.publishDate && params.publishDate.value) {
      queryString += `publishDate=${params.publishDate.value.toISOString()}&`;
    }

    // trim the last &
    return queryString.replace(/\&$/, '');
  }
}
