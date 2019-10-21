import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
// import { Location } from '@angular/common';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { DialogService } from 'ng2-bootstrap-modal';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'lodash';

import { ConfirmComponent } from 'app/confirm/confirm.component';
import { Document } from 'app/models/document';
// import { DocumentService } from 'app/services/document.service';

@Component({
  selector: 'app-application-add-edit',
  templateUrl: './application-add-edit.component.html',
  styleUrls: ['./application-add-edit.component.scss']
})
export class ApplicationAddEditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('applicationForm') applicationForm: NgForm;

  private scrollToFragment: string = null;
  public isSubmitSaveClicked = false;
  public isSubmitting = false;
  public isSaving = false;
  public application = null;
  public startDate: NgbDateStruct = null;
  public endDate: NgbDateStruct = null;
  public delta: number; // # days (including today)
  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();
  private docsToDelete: Document[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    // private location: Location,
    public snackBar: MatSnackBar,
    private dialogService: DialogService,
    // private documentService: DocumentService
  ) {
    // if we have an URL fragment, save it for future scrolling
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = router.parseUrl(router.url);
        this.scrollToFragment = (url && url.fragment) || null;
      }
    });
  }

  // check for unsaved changes before closing (or reloading) current tab/window
  @HostListener('window:beforeunload', ['$event'])
  public handleBeforeUnload(event) {
    if (!this.applicationForm) {
      event.returnValue = true; // no form means page error -- allow unload
    }

    // display browser alert if needed
    if (this.applicationForm.dirty || this.anyUnsavedItems()) {
      event.returnValue = true;
    }
  }

  // check for unsaved changes before navigating away from current route (ie, this page)
  public canDeactivate(): Observable<boolean> | boolean {
    if (!this.applicationForm) {
      return true; // no form means page error -- allow deactivate
    }

    // allow synchronous navigation if everything is OK
    if (!this.applicationForm.dirty && !this.anyUnsavedItems()) {
      return true;
    }

    // otherwise prompt the user with observable (asynchronous) dialog
    return this.dialogService
      .addDialog(
        ConfirmComponent,
        {
          title: 'Unsaved Changes',
          message: 'Click OK to discard your changes or Cancel to return to the application.',
          okOnly: false
        },
        {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        }
      )
      .pipe(takeUntil(this.ngUnsubscribe));
  }

  // this is needed because we don't have a form control that is marked as dirty
  private anyUnsavedItems(): boolean {
    // look for application documents not yet uploaded to db
    if (this.application.meta.documents) {
      for (const doc of this.application.meta.documents) {
        if (!doc._id) {
          return true;
        }
      }
    }

    // look for decision documents not yet uploaded to db
    if (this.application.meta.decision && this.application.meta.decision.meta.documents) {
      for (const doc of this.application.meta.decision.meta.documents) {
        if (!doc._id) {
          return true;
        }
      }
    }

    // look for application or decision documents not yet removed from db
    if (this.docsToDelete && this.docsToDelete.length > 0) {
      return true;
    }

    return false; // no unsaved items
  }

  public cancelChanges() {
    // this.location.back(); // FAILS WHEN CANCEL IS CANCELLED (DUE TO DIRTY FORM OR UNSAVED DOCUMENTS) MULTIPLE TIMES

    if (this.application._id) {
      // go to details page
      this.router.navigate(['/a', this.application._id]);
    } else {
      // go to search page
      this.router.navigate(['/search']);
    }
  }

  ngOnInit() {
    // get data from route resolver
    this.route.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data: { application }) => {
      if (data.application) {
        this.application = data.application;

        // add comment period if there isn't one already (not just on create but also on edit --
        // this will fix the situation where existing applications don't have a comment period)

        // set startDate
        this.startDate = this.dateToNgbDate(this.application.meta.currentPeriod.startDate);
        // set endDate and delta
        this.endDate = this.dateToNgbDate(this.application.meta.currentPeriod.endDate);
        this.onEndDateChg(this.endDate);
      } else {
        alert("Uh-oh, couldn't load application");
        // application not found --> navigate back to search
        this.router.navigate(['/search']);
      }
    });
  }

  ngAfterViewInit() {
    // if requested, scroll to specified section
    if (this.scrollToFragment) {
      // ensure element exists
      const element = document.getElementById(this.scrollToFragment);
      if (element) {
        element.scrollIntoView();
      }
    }
  }

  ngOnDestroy() {
    // dismiss any open snackbar
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private dateToNgbDate(date: Date): NgbDateStruct {
    return date ? { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() } : null;
  }

  private ngbDateToDate(date: NgbDateStruct): Date {
    return new Date(date.year, date.month - 1, date.day);
  }

  // used in template
  public isValidDate(date: NgbDateStruct): boolean {
    return date && !isNaN(date.year) && !isNaN(date.month) && !isNaN(date.day);
  }

  public onStartDateChg(startDate: NgbDateStruct) {
    if (startDate !== null) {
      this.application.meta.currentPeriod.startDate = this.ngbDateToDate(startDate);
      // to set dates, we also need delta
      if (this.delta) {
        this.setDates(true, false, false);
      }
    }
  }

  public onDeltaChg(delta: number) {
    if (delta !== null) {
      this.delta = delta;
      // to set dates, we also need start date
      if (this.application.meta.currentPeriod.startDate) {
        this.setDates(false, true, false);
      }
    }
  }

  public onEndDateChg(endDate: NgbDateStruct) {
    if (endDate !== null) {
      this.application.meta.currentPeriod.endDate = this.ngbDateToDate(endDate);
      // to set dates, we also need start date
      if (this.application.meta.currentPeriod.startDate) {
        this.setDates(false, false, true);
      }
    }
  }

  private setDates(start?: boolean, delta?: boolean, end?: boolean) {
    if (start) {
      // when start changes, adjust end accordingly
      this.application.meta.currentPeriod.endDate = new Date(this.application.meta.currentPeriod.startDate);
      this.application.meta.currentPeriod.endDate.setDate(
        this.application.meta.currentPeriod.startDate.getDate() + this.delta - 1
      );
      this.endDate = this.dateToNgbDate(this.application.meta.currentPeriod.endDate);
    } else if (delta) {
      // when delta changes, adjust end accordingly
      this.application.meta.currentPeriod.endDate = new Date(this.application.meta.currentPeriod.startDate);
      this.application.meta.currentPeriod.endDate.setDate(
        this.application.meta.currentPeriod.startDate.getDate() + this.delta - 1
      );
      this.endDate = this.dateToNgbDate(this.application.meta.currentPeriod.endDate);
    } else if (end) {
      // when end changes, adjust delta accordingly
      // use moment to handle Daylight Saving Time changes
      this.delta =
        moment(this.application.meta.currentPeriod.endDate).diff(
          moment(this.application.meta.currentPeriod.startDate),
          'days'
        ) + 1;
    }
  }

  // add application or decision documents
  public addDocuments(files: FileList, documents: Document[]) {
    if (files && documents) {
      // safety check
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < files.length; i++) {
        if (files[i]) {
          // ensure file is not already in the list
          if (_.find(documents, doc => doc.documentFileName === files[i].name)) {
            this.snackBarRef = this.snackBar.open("Can't add duplicate file", null, { duration: 2000 });
            continue;
          }

          const formData = new FormData();
          formData.append('displayName', files[i].name);
          formData.append('upfile', files[i]);

          const document = new Document();
          document['formData'] = formData; // temporary
          document.documentFileName = files[i].name;

          // save document for upload to db when application is added or saved
          documents.push(document);
        }
      }
    }
  }

  // delete application or decision document
  public deleteDocument(doc: Document, documents: Document[]) {
    if (doc && documents) {
      // safety check
      // remove doc from current list
      _.remove(documents, item => item.documentFileName === doc.documentFileName);

      if (doc._id) {
        // save document for removal from db when application is saved
        this.docsToDelete.push(doc);
      }
    }
  }
}
