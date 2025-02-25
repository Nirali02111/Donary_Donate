import { Injectable, NgModule } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ExtraOptions,
  RouterModule,
  Routes,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PageRouteVariable } from './commons/page-route-variable';
import { NeedAuthGuardGuard } from './commons/auth-gaurd.gaurd';
import { ToiremDonateViewComponent } from './donate/toirem-donate-view/toirem-donate-view.component';
import { SmartPayAPIService } from './services/smart-pay-api.service';

@Injectable({ providedIn: 'root' })
export class CreatePayResolver {
  constructor(private smartPayAPI: SmartPayAPIService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<string | any> {
    return this.smartPayAPI
      .getSmartPaymentStatus(route.queryParamMap.get('UUID') as string)
      .pipe(
        catchError(() => {
          return this.smartPayAPI.smartPay({
            payGUID: route.queryParamMap.get('UUID') as string,
            statusId: 1,
            macAddress: route.queryParamMap.get('dvcId') as string,
            createdBy: route.queryParamMap.get('crtdBy') as string,
          });
        })
      );
  }
}

const routes: Routes = [
  {
    path: `${PageRouteVariable.document_url}/:filename`,
    loadComponent: () =>
      import('./documents/documents.component').then(
        (m) => m.DocumentsComponent
      ),
  },
  {
    path: `${PageRouteVariable.Document_url}/:filename`,
    loadComponent: () =>
      import('./documents/documents.component').then(
        (m) => m.DocumentsComponent
      ),
  },
  {
    path: PageRouteVariable.campaign_login_url,
    loadComponent: () =>
      import('./campaign/campaign-login/campaign-login.component').then(
        (m) => m.CampaignLoginComponent
      ),
  },

  {
    path: PageRouteVariable.validate_voucher_url,
    loadComponent: () =>
      import('./voucher/validate-vouchers.component').then(
        (m) => m.ValidateVouchersComponent
      ),
    canActivate: [NeedAuthGuardGuard],
  },

  {
    path: PageRouteVariable.proccess_url,
    loadComponent: () =>
      import('./voucher-process/voucher-process.component').then(
        (m) => m.VoucherProcessComponent
      ),
    canActivate: [NeedAuthGuardGuard],
  },

  {
    path: PageRouteVariable.success_url,
    loadComponent: () =>
      import('./voucher-success/voucher-success.component').then(
        (m) => m.VoucherSuccessComponent
      ),

    canActivate: [NeedAuthGuardGuard],
  },

  {
    path: PageRouteVariable.create_pay_url,
    resolve: {
      status: CreatePayResolver,
    },
    loadComponent: () =>
      import('./donate/create-pay/create-pay.component').then(
        (m) => m.CreatePayComponent
      ),
  },
  {
    path: PageRouteVariable.NMI_test,
    loadComponent: () =>
      import('./donate/NMI-test/NMI-test-component').then(
        (m) => m.NMITestComponent
      ),
  },

  {
    path: '',
    loadChildren: () =>
      import('./donate/donate.module').then((m) => m.DonateModule),
  },
];

const config: ExtraOptions = {
  useHash: false,
  anchorScrolling: 'enabled',
  // initialNavigation: 'enabled' // Note: Required for SSR
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
