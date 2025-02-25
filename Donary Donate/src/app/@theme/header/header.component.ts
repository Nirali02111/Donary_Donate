import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LocalStorageDataService } from 'src/app/shared/local-storage-data.service';
import { PageRouteVariable } from 'src/app/commons/page-route-variable';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { CommonMethodService } from 'src/app/commons/common-methods.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
declare var $: any;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, NgTemplateOutlet, TranslateModule],
})
export class HeaderComponent implements OnInit {
  isLoginPage: boolean = false;
  isScanPage: boolean = false;
  campaignName: string = '';
  campaignNumber: number = 0;
  login_url: string = '/' + PageRouteVariable.campaign_login_url;
  isToirem: boolean = false;
  @ViewChild('langIcon') langIcon!: ElementRef;
  constructor(
    private router: Router,
    private localStorageDataService: LocalStorageDataService,
    private commonMethodService: CommonMethodService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.isToirem = this.commonMethodService.isToirem();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const routePart = event.url?.split('/');

        if (routePart.includes('campaign-login')) {
          this.isLoginPage = true;
        }
        if (!routePart.includes('campaign-login')) {
          this.isLoginPage = false;
        }
        if (routePart.includes('vouchers') || routePart.includes('campaign-login') || routePart.includes('success') || routePart.includes('process')) {
          this.isScanPage = true;
        }
      }
    });
  }

  logOut() {
    this.localStorageDataService.deleteLoginUserDataandToken();
    this.router.navigateByUrl(this.login_url);
  }

  get CampaignName() {
    return this.localStorageDataService.getCampaignName();
  }

  get CampaignNum() {
    return this.localStorageDataService.getCampaignNum();
  }

  useLanguage(): void {
    if (
      this.translate.currentLang == 'en' ||
      this.translate.currentLang == undefined
    ) {
      this.commonMethodService.isHebrew = true;
      this.translate.use('heb');
      this.langIcon.nativeElement.classList.add('heb');
    } else {
      this.commonMethodService.isHebrew = false;
      this.translate.use('en');
      this.langIcon.nativeElement.classList.remove('heb');
    }
    this.commonMethodService.setGlobalLang(this.commonMethodService.isHebrew);
  }
}
