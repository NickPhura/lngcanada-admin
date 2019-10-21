import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IRecordQueryParamSet } from 'app/services/api';
// import { ExportService } from 'app/services/export.service';

interface IPaginationParameters {
  totalItems?: number;
  currentPage?: number;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  // url parameters, used to set the initial state of the page on load
  public paramMap: ParamMap = null;

  // indicates the page is loading
  public loading = true;
  // indicates a search is in progress
  public searching = false;
  // indicates an export is in progress
  public exporting = false;

  // list of applications to display
  public applications = [];

  // enforce specific comment filter order for esthetics
  // public commentCodes = [CommentCodes.NOT_STARTED, CommentCodes.OPEN, CommentCodes.CLOSED, CommentCodes.NOT_OPEN];

  // selected drop down filters
  public purposeCodeFilters: string[] = [];
  public regionCodeFilter = '';
  public statusCodeFilters: string[] = [];
  public applicantFilter = '';
  // public commentCodeFilters: string[] = [];

  // need to reset pagination when a filter is changed, as we can't be sure how many pages of results will exist.
  public filterChanged = false;

  // pagination values
  public pagination = {
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 25,
    pageCount: 1,
    message: ''
  };

  // sorting values
  public sorting = {
    column: null,
    direction: 0
  };

  constructor(
    private location: Location,
    private router: Router,
    private route: ActivatedRoute
  ) // private exportService: ExportService
  {}

  /**
   * Component init.
   *
   * @memberof ListComponent
   */
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.ngUnsubscribe)).subscribe(paramMap => {
      this.paramMap = paramMap;

      // this.setInitialQueryParameters();
      // this.getRecords();
    });
  }

  /**
   * Fetches records from NRPTI based on the current filter and pagination parameters.
   *
   * Makes 2 calls:
   * - get records (fetches at most pagination.itemsPerPage applications)
   * - get records count (the total count of matching applications, used when rendering pagination controls)
   *
   * @memberof ListComponent
   */
  public getRecords(): void {
    this.searching = true;

    if (this.filterChanged) {
      this.resetPagination();
    }

    // forkJoin(
    //   this.recordService.getAll({ getCurrentPeriod: true }, this.getApplicationQueryParamSets()),
    //   this.recordService.getCount(this.getApplicationQueryParamSets())
    // )
    //   .pipe(takeUntil(this.ngUnsubscribe))
    //   .subscribe(
    //     ([applications, count]) => {
    //       this.updatePagination({ totalItems: count });
    //       this.applications = applications;

    //       this.searching = false;
    //       this.loading = false;
    //     },
    //     error => {
    //       console.log('error = ', error);
    //       alert("Uh-oh, couldn't load applications");
    //       this.router.navigate(['/list']);
    //     }
    //   );
  }

  // Export

  /**
   * Fetches all applications that match the filter criteria (ignores pagination) and parses the resulting json into
   * a csv for download.  Includes more fields than are shown on the web-page.
   *
   * @memberof ListComponent
   */
  public export(): void {
    this.exporting = true;
    const queryParamsSet = this.getApplicationQueryParamSets();

    // ignore pagination as we want to export ALL search results
    queryParamsSet.forEach(element => {
      delete element.pageNum;
      delete element.pageSize;
    });

    // this.applicationService
    //   .getAll({ getCurrentPeriod: true }, queryParamsSet)
    //   .pipe(takeUntil(this.ngUnsubscribe))
    //   .subscribe(
    //     applications => {
    //       // All fields that will be included in the csv, and optionally what the column header text will be.
    //       // See www.npmjs.com/package/json2csv for details on the format of the fields array.
    //       const fields: any[] = [
    //         { label: 'CL File', value: ExportService.getExportPadStartFormatter('cl_file') },
    //         { label: 'Disposition ID', value: 'tantalisID' },
    //         { label: 'Applicant (client)', value: 'client' },
    //         { label: 'Business Unit', value: 'businessUnit' },
    //         { label: 'Location', value: 'location' },
    //         { label: 'Area (hectares)', value: 'areaHectares' },
    //         { label: 'Created Date', value: ExportService.getExportDateFormatter('createdDate') },
    //         { label: 'Publish Date', value: ExportService.getExportDateFormatter('publishDate') },
    //         { label: 'Purpose', value: 'purpose' },
    //         { label: 'Subpurpose', value: 'subpurpose' },
    //         { label: 'status', value: this.getExportStatusFormatter('status', 'reason') },
    //         {
    //           label: 'last status update date',
    //           value: ExportService.getExportDateFormatter('statusHistoryEffectiveDate')
    //         },
    //         { label: 'Type', value: 'type' },
    //         { label: 'Subtype', value: 'subtype' },
    //         { label: 'Tenure Stage', value: 'tenureStage' },
    //         { label: 'Description', value: 'description' },
    //         { label: 'Legal Description', value: 'legalDescription' },
    //         { label: 'Is Retired', value: 'meta.isRetired' },
    //         { label: 'Retire Date', value: ExportService.getExportDateFormatter('meta.retireDate') },
    //         { label: 'Comment Period: Status', value: 'meta.cpStatusStringLong' },
    //         {
    //           label: 'Comment Period: Start Date',
    //           value: ExportService.getExportDateFormatter('meta.currentPeriod.startDate')
    //         },
    //         {
    //           label: 'Comment Period: End Date',
    //           value: ExportService.getExportDateFormatter('meta.currentPeriod.endDate')
    //         },
    //         { label: 'Comment Period: Number of Comments', value: 'meta.numComments' }
    //       ];
    //       this.exportService.exportAsCSV(
    //         applications,
    //         `ACRFD_Applications_Export_${moment().format('YYYY-MM-DD_HH-mm')}`,
    //         fields
    //       );
    //       this.exporting = false;
    //     },
    //     error => {
    //       this.exporting = false;
    //       console.log('error = ', error);
    //       alert("Uh-oh, couldn't export applications");
    //     }
    //   );
  }

  // URL Parameters

  /**
   * Set any initial filter, pagination, and sort values that were saved in the URL.
   *
   * @memberof ListComponent
   */
  public setInitialQueryParameters(): void {
    this.pagination.currentPage = +this.paramMap.get('page') || 1;

    this.sorting.column = (this.paramMap.get('sortBy') && this.paramMap.get('sortBy').slice(1)) || null;
    this.sorting.direction =
      (this.paramMap.get('sortBy') && (this.paramMap.get('sortBy').charAt(0) === '-' ? -1 : 1)) || 0;

    this.purposeCodeFilters = (this.paramMap.get('purpose') && this.paramMap.get('purpose').split('|')) || [];
    this.regionCodeFilter = this.paramMap.get('region') || '';
    this.statusCodeFilters = (this.paramMap.get('status') && this.paramMap.get('status').split('|')) || [];
    this.applicantFilter = this.paramMap.get('applicant') || '';
    // this.commentCodeFilters = (this.paramMap.get('comment') && this.paramMap.get('comment').split('|')) || [];
  }

  /**
   * Builds an array of query parameter sets.
   *
   * Each query parameter set in the array will return a distinct set of results.
   *
   * The combined results from all query parameter sets is needed to fully satisfy the filters.
   *
   * @returns {IRecordQueryParamSet[]} An array of distinct query parameter sets.
   * @memberof ListComponent
   */
  public getApplicationQueryParamSets(): IRecordQueryParamSet[] {
    const recordQueryParamSet: IRecordQueryParamSet[] = [];

    // None of these filters require manipulation or unique considerations

    const basicQueryParams: IRecordQueryParamSet = {
      isDeleted: false,
      pageNum: this.pagination.currentPage - 1, // API starts at 0, while this component starts at 1
      pageSize: this.pagination.itemsPerPage
    };

    if (this.sorting.column && this.sorting.direction) {
      basicQueryParams.sortBy = `${this.sorting.direction === -1 ? '-' : '+'}${this.sorting.column}`;
    }

    recordQueryParamSet.push(basicQueryParams);

    return recordQueryParamSet;
  }

  /**
   * Save filter, pagination, and sort values as params in the URL.
   *
   * @memberof ListComponent
   */
  public saveQueryParameters(): void {
    const params: Params = {};

    params['page'] = this.pagination.currentPage;

    if (this.sorting.column && this.sorting.direction) {
      params['sortBy'] = `${this.sorting.direction === -1 ? '-' : '+'}${this.sorting.column}`;
    }

    if (this.purposeCodeFilters && this.purposeCodeFilters.length) {
      params['purpose'] = this.convertArrayIntoPipeString(this.purposeCodeFilters);
    }
    if (this.regionCodeFilter) {
      params['region'] = this.regionCodeFilter;
    }
    if (this.statusCodeFilters && this.statusCodeFilters.length) {
      params['status'] = this.convertArrayIntoPipeString(this.statusCodeFilters);
    }
    if (this.applicantFilter) {
      params['applicant'] = this.applicantFilter;
    }

    // change browser URL without reloading page (so any query params are saved in history)
    this.location.go(this.router.createUrlTree([], { relativeTo: this.route, queryParams: params }).toString());
  }

  /**
   * Reset filter, pagination, and sort values to their defaults.
   *
   * @memberof ListComponent
   */
  public clearQueryParameters(): void {
    this.pagination.currentPage = 1;
    this.pagination.totalItems = 0;

    this.sorting.column = null;
    this.sorting.direction = 0;

    this.purposeCodeFilters = [];
    this.regionCodeFilter = '';
    this.statusCodeFilters = [];
    this.applicantFilter = '';
    // this.commentCodeFilters = [];

    this.location.go(this.router.createUrlTree([], { relativeTo: this.route }).toString());
  }

  // Filters

  /**
   * Set application purpose filter.
   *
   * @param {string} purposeCode
   * @memberof ListComponent
   */
  public setPurposeFilter(purposeCode: string): void {
    this.purposeCodeFilters = purposeCode ? [purposeCode] : [];
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  /**
   * Set application status filter.
   *
   * @param {string} statusCode
   * @memberof ListComponent
   */
  public setStatusFilter(statusCode: string): void {
    this.statusCodeFilters = statusCode ? [statusCode] : [];
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  /**
   * Set application region filter.
   *
   * @param {string} regionCode
   * @memberof ListComponent
   */
  public setRegionFilter(regionCode: string): void {
    this.regionCodeFilter = regionCode || '';
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  public setApplicantFilter(applicantString: string): void {
    this.applicantFilter = applicantString || '';
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  // Sorting

  /**
   * Sets the sort properties (column, direction) used by the OrderBy pipe.
   *
   * @param {string} sortBy
   * @memberof DocumentsComponent
   */
  public sort(sortBy: string): void {
    if (!sortBy) {
      return;
    }

    if (this.sorting.column === sortBy) {
      // when sorting on the same column, toggle sorting
      this.sorting.direction = this.sorting.direction > 0 ? -1 : 1;
    } else {
      // when sorting on a new column, sort descending
      this.sorting.column = sortBy;
      this.sorting.direction = 1;
    }

    this.saveQueryParameters();
    this.getRecords();
  }

  // Pagination

  /**
   * Updates the pagination variables.
   *
   * Note: some variables can be passed in, while others are always calculated based on other variables, and so can't
   * be set manually.
   *
   * @param {IPaginationParameters} [paginationParams=null]
   * @returns {void}
   * @memberof ListComponent
   */
  public updatePagination(paginationParams: IPaginationParameters = null): void {
    if (!paginationParams) {
      // nothing to update
      return;
    }

    if (paginationParams.totalItems >= 0) {
      this.pagination.totalItems = paginationParams.totalItems;
    }

    if (paginationParams.currentPage >= 0) {
      this.pagination.currentPage = paginationParams.currentPage;
    }

    this.pagination.pageCount = Math.max(1, Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage));

    if (this.pagination.totalItems <= 0) {
      this.pagination.message = 'No applications found';
    } else if (this.pagination.currentPage > this.pagination.pageCount) {
      // This check is necessary due to a rare edge-case where the user has manually incremented the page parameter in
      // the URL beyond what would normally be allowed. As a result when applications are fetched, there aren't enough
      // to reach this page, and so the total applications found is > 0, but the applications displayed for this page
      // is 0, which may confuse users.  Tell them to press clear button which will reset the pagination url parameter.
      this.pagination.message = 'Unable to display results, please clear and re-try';
    } else {
      const low = Math.max((this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1, 1);
      const high = Math.min(this.pagination.totalItems, this.pagination.currentPage * this.pagination.itemsPerPage);
      this.pagination.message = `Displaying ${low} - ${high} of ${this.pagination.totalItems} applications`;
    }
  }

  /**
   * Resets the pagination.currentPage variable locally and in the URL.
   *
   * This is necessary due to a rare edge-case where the user has manually incremented the page parameter in the URL
   * beyond what would normally be allowed. As a result when applications are fetched, there aren't enough to reach
   * this page, and so the total applications found is > 0, but the applications displayed for this page is 0.
   *
   * @memberof ListComponent
   */
  public resetPagination(): void {
    // Minor UI improvement: don't call updatePagination here directly, as it will change the message briefly, before
    // it is updated by the getRecords call.
    this.pagination.currentPage = 1;
    this.saveQueryParameters();
    this.filterChanged = false;
  }

  /**
   * Increments or decrements the pagination.currentPage by 1.
   *
   * @param {number} [page=0] either 1 or -1
   * @memberof ListComponent
   */
  public updatePage(page: number = 0): void {
    if (
      (page === -1 && this.pagination.currentPage + page >= 1) ||
      (page === 1 && this.pagination.pageCount >= this.pagination.currentPage + page)
    ) {
      this.updatePagination({ currentPage: this.pagination.currentPage += page });
      this.saveQueryParameters();
      this.getRecords();
    }
  }

  /**
   * Jumps the pagination to the specified page.  Won't allow changes to pages that have no results.
   *
   * @param {number} [page=0] a number > 0
   * @memberof ListComponent
   */
  public setPage(page: number = 0): void {
    if (page >= 1 && this.pagination.pageCount >= page) {
      this.updatePagination({ currentPage: page });
      this.saveQueryParameters();
      this.getRecords();
    }
  }

  // Other

  /**
   * Turns an array of strings into a single string where each element is deliminited with a pipe character.
   *
   * Example: ['dog', 'cat', 'bird'] => 'dog|cat|bird|'
   *
   * @param {any[]} collection an array of strings to concatenate.
   * @returns {string}
   * @memberof ApiService
   */
  public convertArrayIntoPipeString(collection: string[]): string {
    let values = '';
    _.each(collection, a => {
      values += a + '|';
    });
    // trim the last |
    return values.replace(/\|$/, '');
  }

  getFormattedDate(date: Date = null): string {
    if (!Date) {
      return null;
    }

    return moment(date).format('YYYY-MM-DD');
  }

  /**
   * Cleanup on component destroy.
   *
   * @memberof ListComponent
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
