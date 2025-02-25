import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule, NgbScrollSpyModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TranslateModule } from '@ngx-translate/core';

import {
  RECAPTCHA_LOADER_OPTIONS,
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
} from 'ng-recaptcha';

import { DonateRoutingModule } from './donate-routing.module';

import { ScheduleDemoViewComponent } from './schedule-demo-view/schedule-demo-view.component';
import { DonateLayoutComponent } from './donate-layout/donate-layout.component';
import { IsHebrewDirective } from './directives';

import { GroupListItemComponent } from './group-list-item/group-list-item.component';
import { TeamListItemComponent } from './team-list-item/team-list-item.component';
import { DonateDonorListItemComponent } from './donate-donor-list-item/donate-donor-list-item.component';

import { TeamDonateViewComponent } from './team-donate-view/team-donate-view.component';
import { DonateViewComponent } from './donate-view/donate-view.component';
import { DoanryDirective } from '../commons/modules/doanry-directive.module/doanry-directive.module.module';
import { PhoneInputComponent } from '../commons/phone-input/phone-input.component';

import { environment } from 'src/environments/environment';
import { ToiremDonateViewComponent } from './toirem-donate-view/toirem-donate-view.component';

export class WindowRef {
  getNativeWindow(): any {
    return window;
  }
}

export class DocumentRef {
  getNativeDocument(): any {
    return document;
  }
}

const BROWSER_GLOBALS_PROVIDERS: Provider[] = [WindowRef, DocumentRef];
@NgModule({
  declarations: [
    ScheduleDemoViewComponent,
    DonateLayoutComponent,
    IsHebrewDirective,
    GroupListItemComponent,
    TeamListItemComponent,
    DonateDonorListItemComponent,
    DonateViewComponent,
    TeamDonateViewComponent,
    DonateDonorListItemComponent,
  ],

  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ScrollingModule,
    RecaptchaV3Module,
    HttpClientModule,
    DonateRoutingModule,
    ReactiveFormsModule,
    NgbModule,
    NgSelectModule,
    DoanryDirective,
    NgxMaskDirective,
    NgxMaskPipe,
    TranslateModule,
    PhoneInputComponent,
    NgbScrollSpyModule,
    ToiremDonateViewComponent,
  ],
  providers: [
    provideNgxMask(),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.RECAPTCHA_V3_SITE_KEY,
    },
    {
      provide: RECAPTCHA_LOADER_OPTIONS,
      useValue: {
        onBeforeLoad(_url: any) {
          return {
            url: new URL('https://www.google.com/recaptcha/enterprise.js'),
          };
        },
        onLoaded(recaptcha: any) {
          return recaptcha.enterprise;
        },
      },
    },

    ...BROWSER_GLOBALS_PROVIDERS,
  ],
  exports: [IsHebrewDirective],
})
export class DonateModule {}
