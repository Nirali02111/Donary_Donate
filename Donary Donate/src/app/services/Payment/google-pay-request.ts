import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WalletBase } from './WalletBase';
import { isDevMode } from '@angular/core';

declare const GPButtonSizeMode: any;
declare const GPBillingAddressFormat: any;
declare const iStatus: any;
declare const parseQueryString: any;

declare const GPEnvironment: any;
declare const roundToNumber: any;

/*
export enum iStatus {
  success = 100,
  unsupported = -100,
  error = -200,
}

export enum GPEnvironment {
  test = 'TEST',
  production = 'PRODUCTION',
}

export enum GPButtonSizeMode {
  static = 'static',
  fill = 'fill',
}

export enum GPBillingAddressFormat {
  min = 'MIN',
  full = 'FULL',
}*/

function showHideGoogle(elem: any, toShow: any) {
  if (typeof elem === 'string') {
    elem = document.getElementById(elem);
  }
  if (elem) {
    toShow ? elem.classList.remove('hidden') : elem.classList.add('hidden');
  }
}

function getGoogleAmount() {
  const d = document.getElementById('amount');

  return roundToNumber((d as any).value || '0', 2);
}

export interface GooglePaymentResponse {
  paymentData: {
    email: string | null;
    paymentMethodData: {
      description: string | null;
      info: {
        billingAddress: {
          name: string | null;
          address1: string | null;
          administrativeArea: string | null;
          postalCode: string | null;
        };

        cardDetails: string | null;
        cardNetwork: string | null;
      };
    };
  };
}

export interface GooglePayResponse {
  error: any;
  token: string | null;
  paymentResponse: GooglePaymentResponse | null;
}

export class GooglePayRequest implements WalletBase {
  static _payment = new Subject<GooglePayResponse>();

  static environment = GPEnvironment.test;

  static merchantInfo = {
    merchantName: this.prototype.getMerchantName(),
  };

  static buttonOptions = {
    buttonSizeMode: GPButtonSizeMode.fill,
    buttonType: 'donate',
  };

  static billingParams = {
    billingAddressRequired: true,

    billingAddressFormat: GPBillingAddressFormat.full,

    allowedCardNetworks: [
      'AMEX',
      'DISCOVER',
      'INTERAC',
      'JCB',
      'MASTERCARD',
      'VISA',
    ],
  };

  static getCurrencyFromURL() {
    return parseQueryString(window.location.search).cncy ?? 'USD';
  }

  static getCountryCode(currencyCode: string) {
    if (currencyCode === 'USD') {
      return 'US';
    }

    if (currencyCode === 'ILS') {
      return 'IL';
    }
    if (currencyCode === 'CAD') {
      return 'CA';
    }
    if (currencyCode === 'GBP') {
      return 'UK';
    }
    if (currencyCode === 'EUR') {
      return 'UK';
    }
    return 'US';
  }

  static onGetTransactionInfo() {
    let amt = getGoogleAmount();
    const currencyCode = this.getCurrencyFromURL();
    const countryCode = this.getCountryCode(currencyCode);
    return {
      countryCode: countryCode,
      currencyCode: currencyCode,
      totalPriceStatus: 'FINAL',
      totalPrice: amt.toString(),
      totalPriceLabel: 'Total',
    };
  }

  static onBeforeProcessPayment() {
    return new Promise(function (resolve, reject) {
      try {
        resolve(iStatus.success);
      } catch (err) {
        reject(err);
      }
    });
  }

  static onProcessPayment(paymentResponse: any) {
    return new Promise(function (resolve, reject) {
      try {
        const amt =
          (paymentResponse &&
            paymentResponse.transactionInfo &&
            paymentResponse.transactionInfo.totalPrice) ||
          0;
        try {
          if (amt <= 0) {
            throw 'Payment is not authorized. Invalid amount. Amount must be greater than 0';
          }

          const paymentToken =
            paymentResponse.paymentData.paymentMethodData.tokenizationData
              .token;
          GooglePayRequest._payment.next({
            error: null,
            token: paymentToken,
            paymentResponse: paymentResponse,
          });

          resolve({ status: iStatus.success });
        } catch (err) {
          GooglePayRequest._payment.next({
            error: err,
            token: null,
            paymentResponse: null,
          });
          reject({ error: err });
        }
      } catch (err) {
        GooglePayRequest._payment.next({
          error: err,
          token: null,
          paymentResponse: null,
        });
        reject(err);
      }
    });
  }

  static onPaymentCanceled(respCanceled: any) {
    setTimeout(function () {
      alert('Payment was canceled');
    }, 500);
  }

  static handleResponse(resp: any) {
    const respObj = JSON.parse(resp);
    if (respObj) {
      if (respObj.xError) {
        setTimeout(function () {
          alert(`There was a problem with your order (${respObj.xRefNum})!`);
        }, 500);
      } else
        setTimeout(function () {
          alert(`Thank you for your order (${respObj.xRefNum})!`);
        }, 500);
    }
  }

  /**
   * Set Sandbox mode
   * @returns
   */
  static getGPEnvironment() {
    if (
      !environment.baseUrl.includes(
        'https://dev-api.donary.com/'
      )
    ) {
      return GPEnvironment.production;
    }
    return GPEnvironment.test;
  }

  static initGP() {
    return {
      merchantInfo: this.merchantInfo,
      buttonOptions: this.buttonOptions,
      environment: this.getGPEnvironment(),
      billingParameters: this.billingParams,
      shippingParameters: {
        shippingAddressRequired: false,
        shippingOptionRequired: false,
      },
      onGetTransactionInfo: 'GooglePayRequest.onGetTransactionInfo',
      onBeforeProcessPayment: 'GooglePayRequest.onBeforeProcessPayment',
      onProcessPayment: 'GooglePayRequest.onProcessPayment',
      onPaymentCanceled: 'GooglePayRequest.onPaymentCanceled',
      onGPButtonLoaded: 'GooglePayRequest.gpButtonLoaded',
      isDebug: false,
    };
  }

  static gpButtonLoaded(resp: any) {
    if (!resp) return;
    if (resp.status === iStatus.success) {
      showHideGoogle('divGpay', true);
    } else if (resp.status === iStatus.unsupported) {
      GooglePayRequest._payment.next({
        error: iStatus.unsupported,
        token: null,
        paymentResponse: null,
      });
    } else if (resp.reason) {
      alert(resp.reason);
    }
  }

  getMerchantName(): string | number {
    // return 'Example Merchant';
    return environment.SMART_PAY_MERCHANT_NAME;
  }

  static setMerchantName(name: string) {
    this.merchantInfo.merchantName = name;
  }

  getMerchantId(): string | number {
    return environment.SMART_PAY_MERCHANT_ID;
  }
}
