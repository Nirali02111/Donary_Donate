import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WalletBase } from './WalletBase';

declare const APButtonColor: any;
declare const APButtonType: any;
declare const iStatus: any;

declare const roundToNumber: any;

declare const roundTo: any;

export type ApplePaymentType = 'debit' | 'credit' | 'prepaid' | 'store';

export interface ApplePayContactDetails {
  phoneNumber: string | null;
  emailAddress: string | null;
  givenName: string | null;
  familyName: string | null;
  phoneticGivenName: string | null;
  phoneticFamilyName: string | null;
  addressLines: Array<string> | null;
  subLocality: string | null;
  locality: string | null;
  postalCode: string | null;
  subAdministrativeArea: string | null;
  administrativeArea: string | null;
  country: string | null;
  countryCode: string | null;
}

export interface ApplePaymentTokenObj {
  paymentData: Object; // need to convert this for token submitting in API
  paymentMethod: {
    displayName: string | null;
    network: string | null;
    type: ApplePaymentType;
    paymentPass?: {
      primaryAccountIdentifier: string | null;
      primaryAccountNumberSuffix: string | null;
      deviceAccountIdentifier: string | null;
      deviceAccountNumberSuffix: string | null;
      activationState: {};
    };
    billingContact?: ApplePayContactDetails;
  };
  transactionIdentifier: string | null;
}

export interface ApplePaymentResponse {
  billingContact: ApplePayContactDetails;
  shippingContact: ApplePayContactDetails;
  token: ApplePaymentTokenObj;
}

export interface ApplePayResponse {
  error: any;
  payment: ApplePaymentResponse | null;
}

function showHideApple(elem: any, toShow: any) {
  if (typeof elem === 'string') {
    elem = document.getElementById(elem);
  }
  if (elem) {
    toShow ? elem.classList.remove('hidden') : elem.classList.add('hidden');
  }
}

function getAppleAmount() {
  const d = document.getElementById('amount');

  return roundToNumber((d as any).value || '0', 2);
}

export class ApplePaymentRequest implements WalletBase {
  static _payment = new Subject<ApplePayResponse>();

  static buttonOptions = {
    buttonContainer: 'ap-dnr-container',
    buttonColor: APButtonColor.black,
    buttonType: APButtonType.donate,
  };

  static totalAmount: any = null;
  static taxAmt: any = null;
  static creditType: any = null;

  static getTransactionInfo(
    taxAmt: any,
    creditType?: any
  ) {
    // console.log('getTransactionInfo', shippingMethod, creditType);
    try {
      // this.taxAmt = roundToNumber(taxAmt, 4) || this.taxAmt || 0.07;
      this.taxAmt = 0;
      this.creditType = creditType || this.creditType;
      const amt = getAppleAmount();
      const lineItems = [
        {
          label: 'Subtotal',
          type: 'final',
          amount: amt,
        },
      ];
      if (this.creditType === 'credit') {
        lineItems.push({
          label: 'Credit Card Fee',
          amount: roundTo(0 * amt, 2),
          type: 'final',
        });
      }
      lineItems.push({
        label: 'Estimated Tax',
        amount: roundTo(this.taxAmt * amt, 2),
        type: 'final',
      });
      let totalAmt = 0;
      lineItems.forEach((item) => {
        totalAmt += parseFloat(item.amount) || 0;
      });
      totalAmt = roundTo(totalAmt, 2);
      this.totalAmount = totalAmt;

      return {
        lineItems: lineItems,
        total: {
          type: 'final',
          label: 'Total',
          amount: totalAmt,
        },
      };
    } catch (err) {
      ApplePaymentRequest._payment.next({ error: err, payment: null });

      return;
    }
  }

  static onGetTransactionInfo(
    taxAmt: any,
    creditType: any
  ) {
    try {
      console.log('onGetTransactionInfo', creditType);
      return this.getTransactionInfo(taxAmt, creditType);
    } catch (err) {
      ApplePaymentRequest._payment.next({ error: err, payment: null });
      return;
    }
  }

  static onShippingContactSelected(shippingContact: any) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        console.log('onShippingContactSelected', shippingContact);
        let taxAmt = 0.1;
        if (shippingContact && shippingContact.administrativeArea) {
          if (shippingContact.administrativeArea === 'NY') {
            taxAmt = 0.0875;
          } else if (shippingContact.administrativeArea === 'NJ') {
            taxAmt = 0.07;
          }
        }
        const resp: any = self.getTransactionInfo(
          taxAmt,
        );
        console.log('onShippingContactSelected return', resp);
        resolve(resp);
      } catch (err) {
        ApplePaymentRequest._payment.next({ error: err, payment: null });
        reject({ errors: [err] });
      }
    });
  }

  static onPaymentMethodSelected(paymentMethod: any) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        console.log('onPaymentMethodSelected ', paymentMethod);
        const resp = self.getTransactionInfo(null, paymentMethod.type);
        console.log('onPaymentMethodSelected return', resp);

        resolve(resp);
      } catch (err) {
        ApplePaymentRequest._payment.next({ error: err, payment: null });
        reject({ errors: [err] });
      }
    });
  }

  static validateApplePayMerchant() {
    return new Promise((resolve, reject) => {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.cardknox.com/applepay/validate');
        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            resolve(xhr.response);
          } else {
            console.error(
              'validateApplePayMerchant',
              JSON.stringify(xhr.response),
              this.status
            );
            reject({
              status: this.status,
              statusText: xhr.response,
            });
          }
        };
        xhr.onerror = function () {
          console.error(
            'validateApplePayMerchant',
            xhr.statusText,
            this.status
          );
          reject({
            status: this.status,
            statusText: xhr.statusText,
          });
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
      } catch (err) {
        setTimeout(function () {
          ApplePaymentRequest._payment.next({ error: err, payment: null });
        }, 100);
      }
    });
  }

  static onValidateMerchant() {
    return new Promise((resolve, reject) => {
      try {
        this.validateApplePayMerchant()
          .then((response) => {
            try {
              resolve(response);
            } catch (err) {
              console.error(
                'validateApplePayMerchant exception.',
                JSON.stringify(err)
              );
              reject(err);
            }
          })
          .catch((err) => {
            console.error(
              'validateApplePayMerchant error.',
              JSON.stringify(err)
            );
            reject(err);
          });
      } catch (err) {
        console.error('onValidateMerchant error.', JSON.stringify(err));
        reject(err);
      }
    });
  }

  static onPaymentAuthorize(applePayload: any) {
    return new Promise(function (resolve, reject) {
      try {
        console.log('onPaymentAuthorize', applePayload);
        resolve(applePayload);
      } catch (err) {
        ApplePaymentRequest.handleAPError(err);
        reject(err);
      }
    });
  }

  static onPaymentComplete(paymentComplete: any) {
    console.log('onPaymentComplete', paymentComplete);
    if (paymentComplete.response) {
      console.log('onPaymentComplete returning', paymentComplete.response);
      ApplePaymentRequest._payment.next({
        error: null,
        payment: paymentComplete.response,
      });
    } else if (paymentComplete.error) {
      console.log('onPaymentComplete have error', paymentComplete.error);
      this.handleAPError(paymentComplete.error);
    }
  }

  static handleAPError(err: any) {
    ApplePaymentRequest._payment.next({
      error: err,
      payment: null,
    });
  }

  static initAP() {
    return {
      buttonOptions: this.buttonOptions,
      merchantIdentifier: this.prototype.getMerchantId(),
      requiredBillingContactFields: this.prototype.getContactFields(),
      onGetTransactionInfo: 'ApplePaymentRequest.onGetTransactionInfo',
      onShippingContactSelected:
        'ApplePaymentRequest.onShippingContactSelected',
      onPaymentMethodSelected: 'ApplePaymentRequest.onPaymentMethodSelected',
      onValidateMerchant: 'ApplePaymentRequest.onValidateMerchant',
      onPaymentAuthorize: 'ApplePaymentRequest.onPaymentAuthorize',
      onPaymentComplete: 'ApplePaymentRequest.onPaymentComplete',
      onAPButtonLoaded: 'ApplePaymentRequest.apButtonLoaded',
      isDebug: false,
    };
  }

  static apButtonLoaded(resp: any) {
    if (!resp) return;
    if (resp.status === iStatus.success) {
      showHideApple(this.buttonOptions.buttonContainer, true);
    } else if (resp.status === iStatus.unsupported) {
      ApplePaymentRequest._payment.next({
        error: iStatus.unsupported,
        payment: null,
      });
    } else if (resp.reason) {
      console.log(resp);
    }
  }

  getContactFields() {
    //return ['postalAddress', 'name', 'phone', 'email'];
    return [];
  }

  getMerchantName(): string | number {
    return environment.SMART_PAY_MERCHANT_NAME;
  }

  getMerchantId(): string | number {
    // return 'merchant.cardknoxdev.com';
    return environment.SMART_PAY_MERCHANT_ID;
  }
}
