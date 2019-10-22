// modules
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApplicationsRoutingModule } from './applications-routing.module';
import { InlineSVGModule } from 'ng-inline-svg';

// components
import { ApplicationDetailComponent } from './application-detail/application-detail.component';
import { ApplicationAddEditComponent } from './application-add-edit/application-add-edit.component';

// services
import { ApiService } from 'app/services/api';
import { ExportService } from 'app/services/export.service';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    SharedModule,
    NgxPaginationModule,
    NgbModule.forRoot(),
    InlineSVGModule.forRoot(),
    ApplicationsRoutingModule
  ],
  declarations: [ApplicationDetailComponent, ApplicationAddEditComponent],
  exports: [ApplicationDetailComponent, ApplicationAddEditComponent],
  providers: [ApiService, ExportService]
})
export class ApplicationsModule {}
