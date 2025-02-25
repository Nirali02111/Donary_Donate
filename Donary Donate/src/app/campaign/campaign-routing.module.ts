import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CampaignLoginComponent } from './campaign-login/campaign-login.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: CampaignLoginComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampaignRoutingModule {}
