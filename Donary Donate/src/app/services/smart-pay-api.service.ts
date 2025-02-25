import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UpdatePaymentStatusPayload {
  payGUID: string;
  statusId: number;
  macAddress?: string;
  createdBy: string;
  amount?: string;
}

export interface CampaignDevice {
  deviceId: number | string | null;
  CampaignId: number | string | null;
  currency: string | null;
}


@Injectable({
  providedIn: 'root',
})
export class SmartPayAPIService {
  private version = 'v2/';
  private SMART_PAY_ROUTE = 'SmartPay';

  private SMART_PAY_UPDATE_PAYMENT_STATUS_URL = `${this.version}${this.SMART_PAY_ROUTE}/UpdatePaymentStatus`;

  private SMART_PAY_GET_PAYMENT_STATUS_URL = `${this.version}${this.SMART_PAY_ROUTE}/GetPaymentStatus`;

  private SMART_PAY_GATEWAY_INFO_URL = `${this.version}${this.SMART_PAY_ROUTE}/GetSmartPayGatewayInfo`;

  constructor(private http: HttpClient) { }

  smartPay(formData: UpdatePaymentStatusPayload): Observable<string> {
    return this.http
      .post<string>(this.SMART_PAY_UPDATE_PAYMENT_STATUS_URL, formData)
      .pipe((response) => {
        return response;
      });
  }

  getSmartPaymentStatus(payGuid: string): Observable<string> {
    return this.http
      .get<string>(this.SMART_PAY_GET_PAYMENT_STATUS_URL, {
        params: { payGuid },
      })
      .pipe((response) => {
        return response;
      });
  }

  getSmartPayGatewayInfo(payload: CampaignDevice) {
    return this.http
      .post<any>(this.SMART_PAY_GATEWAY_INFO_URL, payload)
  }
}
