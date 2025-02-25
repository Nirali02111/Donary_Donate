import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignRoutingModule } from './campaign-routing.module';
import { CampaignLoginComponent } from './campaign-login/campaign-login.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
    imports: [
    CommonModule,
    CampaignRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    CampaignLoginComponent,
],
})
export class CampaignModule {}
