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
  Until = 'until' // date must be before this date
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
 * Supported query parameters for record requests.
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
}

/**
 * Supported query parameters for document requests.
 *
 * Note: all parameters are optional.
 *
 * @export
 * @interface IRecordQueryParamSet
 */
export interface IDocumentQueryParamSet {
  pageNum?: number;
  pageSize?: number;
  sortBy?: string;
  isDeleted?: boolean;
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
    let errorMessage = 'Unknown Server Error';

    if (error) {
      if (error.message) {
        if (error.error) {
          errorMessage = `${error.message} - ${error.error.message}`;
        } else {
          errorMessage = error.message;
        }
      } else if (error.status) {
        errorMessage = `${error.status} - ${error.statusText}`;
      }
    }

    console.log('Server Error:', errorMessage);
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
   * Checks each record query parameter of the given queryParams and builds a single query string.
   *
   * @param {IRecordQueryParamSet} queryParams
   * @returns {string}
   * @memberof ApiService
   */
  public buildRecordQueryParametersString(params: IRecordQueryParamSet): string {
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

    // trim the last &
    return queryString.replace(/\&$/, '');
  }

  /**
   * Checks each document query parameter of the given queryParams and builds a single query string.
   *
   * @param {IDocumentQueryParamSet} queryParams
   * @returns {string}
   * @memberof ApiService
   */
  public buildDocumentQueryParametersString(params: IDocumentQueryParamSet): string {
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

    // trim the last &
    return queryString.replace(/\&$/, '');
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
}
