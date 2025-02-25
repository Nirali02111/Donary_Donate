// google-pay.service.ts
import { Injectable } from '@angular/core';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GooglePayService {

  private paymentsClient: any = null;
  private baseRequest = { apiVersion: 2, apiVersionMinor: 0 };
  private allowedCardNetworks = ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"];
  private allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];
  private tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: { gateway: 'payarc', gatewayMerchantId: 'PEkwDzWPkkWWz4jW' }
  };
  private baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: this.allowedCardAuthMethods,
      allowedCardNetworks: this.allowedCardNetworks
    }
  };
  private cardPaymentMethod = { ...this.baseCardPaymentMethod, tokenizationSpecification: this.tokenizationSpecification };
  private merchantInfo= { merchantId: 'BCR2DN4T26OP3XZD', merchantName: "" };//merchantId is fixed
  private transInfo= { countryCode: 'US', currencyCode: 'USD', totalPriceStatus: 'FINAL', totalPrice: '1.00' };

  private getGooglePaymentsClient(env:string): any {
    if (!this.paymentsClient) {
      this.paymentsClient = new google.payments.api.PaymentsClient({ environment: env });//'TEST','PRODUCTION'
    }
    return this.paymentsClient;
  }

  setTokenizationSpecification(gateway:string, gatewayMerchantId:string){
      this.tokenizationSpecification={
        type: 'PAYMENT_GATEWAY',
        parameters: { gateway: gateway, gatewayMerchantId: gatewayMerchantId}//'PEkwDzWPkkWWz4jW' }
      };
  }

  setMerchantInfo(merchantId:string, merchantName:string){
      this.merchantInfo= { merchantId: merchantId, merchantName: merchantName };
  }

  setTransInfo(countryCode:string, currencyCode:string, totalPrice:any){
    this.transInfo = { countryCode: this.getCountryCode(countryCode), currencyCode: currencyCode, totalPriceStatus: 'FINAL', totalPrice: totalPrice };
  }

  getGoogleIsReadyToPayRequest(): any {
    return { ...this.baseRequest, allowedPaymentMethods: [this.baseCardPaymentMethod] };
  }

  getGooglePaymentDataRequest(): any {
    return {
      ...this.baseRequest,
      allowedPaymentMethods: [this.cardPaymentMethod],
      transactionInfo: this.getGoogleTransactionInfo(),
      merchantInfo: this.merchantInfo
    };
  }

  getGoogleTransactionInfo(): any {
    return this.transInfo;//{ countryCode: 'US', currencyCode: 'USD', totalPriceStatus: 'FINAL', totalPrice: '1.00' };
  }  

  loadPaymentData(env:string):  Promise<any> {
    const request = this.getGooglePaymentDataRequest();
    return this.getGooglePaymentsClient(env)
      .loadPaymentData(request)
      .then((paymentData : any) => {
        return paymentData;
      })
      //.then((paymentData : any) => this.processPayment(paymentData))
      .catch((err: any) => {console.error(err); throw err;});
  }

  processPayment(paymentData: any): void {
    console.log(paymentData);
    const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
    console.log('Payment Token:', paymentToken);
  }

  getCountryCode(countryCode: string) {
    if (countryCode === 'USD') {
      return 'US';
    }

    return countryCode ?? 'US';
  }

}
