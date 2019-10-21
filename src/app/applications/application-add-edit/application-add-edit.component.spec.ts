import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'ng2-bootstrap-modal';

import { ApplicationAddEditComponent } from './application-add-edit.component';
import { FileUploadComponent } from 'app/file-upload/file-upload.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material';
import { DocumentService } from 'app/services/document.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SearchComponent } from 'app/search/search.component';

describe('ApplicationAddEditComponent', () => {
  let component: ApplicationAddEditComponent;
  let fixture: ComponentFixture<ApplicationAddEditComponent>;

  const matSnackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open', 'dismiss']);
  const documentServiceSpy = jasmine.createSpyObj('DocumentService', ['add', 'save', 'publish']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NgbModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'search', component: SearchComponent }])
      ],
      declarations: [ApplicationAddEditComponent, FileUploadComponent, SearchComponent],
      providers: [
        DialogService,
        { provide: MatSnackBar, useValue: matSnackBarSpy },
        { provide: DocumentService, useValue: documentServiceSpy }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationAddEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
