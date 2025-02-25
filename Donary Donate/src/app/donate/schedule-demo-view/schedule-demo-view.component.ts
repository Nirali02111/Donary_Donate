import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { PageRouteVariable } from 'src/app/commons/page-route-variable';

export {};
declare global {
  interface Window {
    Calendly: any;
  }
}

@Component({
  selector: 'app-schedule-demo-view',
  templateUrl: './schedule-demo-view.component.html',
  styleUrls: ['./schedule-demo-view.component.scss'],
})
export class ScheduleDemoViewComponent implements OnInit, AfterViewInit {
  public currentYear: number = new Date().getFullYear();

  get ProductAndPlanLink() {
    return `https://p.donary.com/productandplans`;
  }

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }

  ngOnInit() {
    this.currentYear = new Date().getFullYear();

    window.Calendly.initInlineWidget({
      url: 'https://calendly.com/donary/15min?text_color=21263d&primary_color=7B5BC4&hide_gdpr_banner=1',
      parentElement: document.querySelector('.calendly-inline-widget'),
    });
  }

  getDonateRoute() {
    return [`/`];
  }

  getScheduleDemoRoute() {
    return [`/${PageRouteVariable.schedule_demo_url}`];
  }
}
