import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'app/services/api';
import { DocumentService } from 'app/services/document.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss']
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  public isPublishing = false;
  public isUnpublishing = false;
  public isDeleting = false;
  public isRefreshing = false;
  public application = null;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public snackBar: MatSnackBar,
    public api: ApiService, // also used in template
    // private dialogService: DialogService,
    public documentService: DocumentService
  ) {}

  ngOnInit() {
    // get data from route resolver
    this.route.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data: { application }) => {
      if (data.application) {
        this.application = data.application;
      } else {
        alert("Uh-oh, couldn't load records");
        // application not found --> navigate back to search
        this.router.navigate(['/search']);
      }
    });
  }

  ngOnDestroy() {
    // dismiss any open snackbar
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
