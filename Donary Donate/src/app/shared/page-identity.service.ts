import { Injectable } from '@angular/core';
import { PageTypes } from '../enum/PageTypes';

@Injectable({
  providedIn: 'root'
})
export class PageIdentityService {
  get Brand() {
    return window.location.host.includes('campaign-login')
      ? PageTypes.CAMPAIGN
      : PageTypes.DONATE; //commented for now - for SE design test
  }

  get isDonate() {
    return this.Brand === PageTypes.DONATE;
  }

  get isCampaign() {
    return this.Brand === PageTypes.CAMPAIGN;
  }
  constructor() { }
}
