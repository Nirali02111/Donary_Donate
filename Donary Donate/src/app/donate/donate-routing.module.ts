import { Injectable, NgModule } from '@angular/core';
import { Routes, RouterModule, ActivatedRouteSnapshot } from '@angular/router';
import { catchError, map, Observable, of, Subject } from 'rxjs';
import {
  DonatePageAPIService,
  GetDonatePageResponse,
} from 'src/app/services/donate-page-api.service';
import { DonateViewComponent } from './donate-view/donate-view.component';
import { ScheduleDemoViewComponent } from './schedule-demo-view/schedule-demo-view.component';
import { TeamDonateViewComponent } from './team-donate-view/team-donate-view.component';
import { PageRouteVariable } from '../commons/page-route-variable';
import { CommonMethodService } from '../commons/common-methods.service';

@Injectable({ providedIn: 'root' })
export class DonateResolver {
  constructor(
    private donatePageAPI: DonatePageAPIService,
    private commonService: CommonMethodService
  ) { }

  resolve(
    route: ActivatedRouteSnapshot
  ):
    | Observable<GetDonatePageResponse>
    | Promise<GetDonatePageResponse>
    | GetDonatePageResponse {
    const macAddress = this.commonService.isToirem()
      ? this.commonService.getMacAddress(
        route.paramMap.get('macAddress') || null
      )
      : route.paramMap.get('macAddress') || '';

    return this.donatePageAPI.geDonatePageData({
      macAddress: macAddress,
    })

      .pipe(
        map((response: any) => {
          if (response) {
            return response;  // Return the data if it's valid
          } else {
            console.log('Reason not found');
            return null;
          }
        }),
        catchError((error) => {
          const err = error
          if (error.status === 404) {
            //404 error
            this.commonService.error404 = error.error?.title ? error.error?.title : error.error
            console.log('404 error');

          } else {
            // Emit other types of errors if needed
            console.log('An error occurred');
          }
          return of(this.getDefaultDonatePageResponse());
        })
      );
  }
  getDefaultDonatePageResponse(): GetDonatePageResponse {


    return {
      campaignBonusGoal: 0,
      strcampaignBonusGoal: '',
      campaignDescription: '',
      campaignEndTime: '',
      campaignGoal: 0,
      campaignImage: '',
      campaignImageBase64: null,
      bonusGoalPercentage: 0,
      campaignName: '',
      campaignStartTime: '',
      fundRaisedPercent: 0,
      lstDonateReason: [],
      lstDonorDonation: [],
      lstEventAmount: [],
      lstSetting: [],
      lstGroup: [],
      totalDonors: null,
      totalFundRaised: 0
    };
  }
};



const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: DonateViewComponent,
      },
      {
        path: PageRouteVariable.schedule_demo_url,
        component: ScheduleDemoViewComponent,
      },

      {
        path: ':macAddress',
        children: [
          {
            path: '',
            component: TeamDonateViewComponent,
            resolve: {
              donateData: DonateResolver,
            },
          },
          {
            path: ':teamId',
            component: TeamDonateViewComponent,
            resolve: {
              donateData: DonateResolver,
            },
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DonateRoutingModule { }
