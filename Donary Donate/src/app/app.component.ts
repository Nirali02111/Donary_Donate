import { Component, OnInit, Renderer2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './@theme/header/header.component';
import { NgFor, NgIf } from '@angular/common';
import { CommonMethodService } from './commons/common-methods.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, RouterOutlet, HeaderComponent],
})
export class AppComponent implements OnInit {
  title = 'DonaryDonateAngular';
  path = '';
  isCampaignBrand: boolean = false;
  isToirem: boolean = false;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private commonMethodService: CommonMethodService
  ) {}

  ngOnInit(): void {
    this.isToirem = this.commonMethodService.isToirem();
    this.translate.setDefaultLang('en');
    this.router.events.subscribe(() => {
      this.isCampaignPage();
    });
  }

  isCampaignPage() {
    this.path = window.location.pathname;
    if (
      this.path.includes('campaign-login') ||
      this.path.includes('vouchers') ||
      this.path.includes('process') ||
      this.path.includes('success')
    ) {
      this.isCampaignBrand = true;
    }
  }
}
