import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PageRouteVariable {
  public static schedule_demo_url: string = 'schedule-demo';
  public static campaign_login_url: string = 'campaign-login';
  public static validate_voucher_url: string = 'vouchers';
  public static proccess_url: string = 'process';
  public static success_url: string = 'success';

  public static create_pay_url: string = 'create';

  public static DonorProductPlans_url = '';
  public static document_url: string = 'docs'
  public static Document_url: string = 'Docs'
  public static NMI_test: string = 'nuchem-l-page'
}
