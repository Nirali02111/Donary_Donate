import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface loginPayload {
  campaignNum: number | null;
  last4OfPhone: string | null;
  key: string;
}
@Injectable({
  providedIn: 'root'
})

export class CampaignService {
  version = 'v1';
  AUTHENTICATION_URL = `${this.version}/authentication`;
  LOGIN_URL = this.AUTHENTICATION_URL + '/ToiremCampaignLogin';

  constructor(private http: HttpClient) { }

  login(formData: loginPayload): Observable<any> {
    return this.http.post(this.LOGIN_URL, formData);
  }
}
