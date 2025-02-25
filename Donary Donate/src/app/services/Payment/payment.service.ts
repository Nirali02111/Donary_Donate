import { Injectable } from '@angular/core';
import { GooglePayRequest } from './google-pay-request';
import { ApplePaymentRequest } from './apple-payment-request';

@Injectable({
  providedIn: 'root',
})
export class SmartPaymentService {
  _googlePayment$ = GooglePayRequest._payment.asObservable();

  _applePayment$ = ApplePaymentRequest._payment.asObservable();

  constructor() {}
}

export function globalServiceFactory() {
  const globalService = new SmartPaymentService();

  (window as any).GooglePayRequest = GooglePayRequest;
  // (window as any).gpRequest = gpRequest; // use only for native behavior
  (window as any).ApplePaymentRequest = ApplePaymentRequest;

  return globalService;
}
