import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface ResponseMessageObj {
  paymentId: number | null;
  statusId: number | null;
  serverRejected: string | null;
  approval: string | null;
  isEmailExists: boolean;
  isPhoneExists: boolean;
  receiptNum: string | null;
  accountNum: string | null;
  donorName: string | null;
  donorJewishName: null;
  donorFullName: string | null;
  phone: string | null;
  email: string | null;
  accountId: number | null;
  refNum: string | null;
  ticketId: null;
  queueId: null;
  copies: null;
  rafflesText: '';
  telegroundResponse: null;
  message: null;
  scheduleID: null;
  scheduleTotal: null;
  webhookUrl: null;
  currencyAmount: number | null;
  currency: string | null;
  phoneLabel: null;
  emailLabel: string | null;
}

export interface DevicePayResponse {
  isGatewayTransSucceed: boolean;
  gatewayRefNum: string | null;
  errorResponse: string | null;
  isDBTransSucceed: boolean;
  paymentStatus: string | null;
  isPaymentExist: boolean;
  responseTitle: string | null;
  responseMessage: Array<ResponseMessageObj> | null;
  teleGroundResponse: null;
  amount: null;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  version = 'v2/';
  PAYMENT_MAIN_URL = 'payment';

  private DONATE_DEVICE_PAY_URL = `${this.version}${this.PAYMENT_MAIN_URL}/DevicePay`;

  constructor(private http: HttpClient) {}

  DevicePay(formData: any): Observable<DevicePayResponse> {
    return this.http
      .post<DevicePayResponse>(this.DONATE_DEVICE_PAY_URL, formData)
      .pipe((response) => {
        return response;
      });
  }
}
