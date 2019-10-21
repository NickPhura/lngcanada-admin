import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import * as _ from 'lodash';

@Injectable()
export class ApplicationDetailResolver implements Resolve<any> {
  constructor() {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const appId = route.paramMap.get('appId');

    if (appId === '0') {
      // create new application
      const application = {
        purpose: route.queryParamMap.get('purpose'),
        subpurpose: route.queryParamMap.get('subpurpose'),
        type: route.queryParamMap.get('type'),
        subtype: route.queryParamMap.get('subtype'),
        status: route.queryParamMap.get('status'),
        reason: route.queryParamMap.get('reason'),
        tenureStage: route.queryParamMap.get('tenureStage'),
        location: route.queryParamMap.get('location'),
        businessUnit: route.queryParamMap.get('businessUnit'),
        cl_file: +route.queryParamMap.get('cl_file'), // NB: unary operator
        tantalisID: +route.queryParamMap.get('tantalisID'), // NB: unary operator
        legalDescription: route.queryParamMap.get('legalDescription'),
        client: route.queryParamMap.get('client'),
        statusHistoryEffectiveDate: route.queryParamMap.get('statusHistoryEffectiveDate')
      };

      return of(application);
    }
  }
}
