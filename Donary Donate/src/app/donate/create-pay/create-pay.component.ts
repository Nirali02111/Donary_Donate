import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CommonModule, CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { PaymentService as PaymentAPIService } from 'src/app/services/payment.service';
import {
  ApplePayResponse,
  ApplePaymentResponse,
} from 'src/app/services/Payment/apple-payment-request';
import {
  GooglePaymentResponse,
  GooglePayRequest,
  GooglePayResponse,
} from 'src/app/services/Payment/google-pay-request';
import { SmartPaymentService } from 'src/app/services/Payment/payment.service';

import {
  CampaignDevice,
  SmartPayAPIService,
} from 'src/app/services/smart-pay-api.service';
import { SMART_PAYMENT_STATUS } from 'src/app/enum/PageTypes';
import { CommonMethodService } from 'src/app/commons/common-methods.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { GooglePayService } from 'src/app/services/Payment/google-pay.service';

declare const ckGooglePay: any;
declare const ckApplePay: any;
declare var $: any;
declare const CollectJS: any;

interface AllParam {
  uuid: string | null;
  cmpId: string | null;
  amount: string | null;
  dvcId: string | null;
  createdBy: string | null;
  cncy: string | null;
  lat: string | null;
  lon: string | null;
}

type ERROR_TYPES = '' | 'ALREADY_PROCESSED' | 'ALREADY_EXIST';

@Component({
  selector: 'app-create-pay',
  templateUrl: './create-pay.component.html',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgTemplateOutlet,
    NgxMaskDirective,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  styleUrls: ['./create-pay.component.scss'],
  providers: [NgxMaskDirective, provideNgxMask()],
})
export class CreatePayComponent implements OnInit, AfterViewInit {
  isLoading = true;
  isPaymentProcess = false;
  isPaymentDone = false;
  isErrorInPayment = false;
  isGoogle = false;

  errorType: ERROR_TYPES = '';

  gpRequest = 'GooglePayRequest.initGP';

  commonOption = {
    amountField: 'amount',
  };

  allParams: AllParam = {
    uuid: '',
    cmpId: '',
    amount: '',
    dvcId: '',
    createdBy: '',
    cncy: '',
    lat: '',
    lon: '',
  };

  cardHolderName: string | null = null;
  fullAddress: string | null = null;
  methodDescription: string | null = null;
  @ViewChild('amtInput', { static: true })
  amtInput!: ElementRef<HTMLInputElement>;
  @ViewChild('amountInput')
  amountInput!: ElementRef<HTMLInputElement>;
  errorResponseMsg: string | null = null;
  separatorLimit = '10000000';
  editAmt: boolean = false;
  initialAmount: string | null = '';
  showError: boolean = false;
  amountRequireMsg = 'Amount is required.';
  isNMI: boolean = environment.IS_NMI;
  nmiToken: string | null = null;
  paymentButton: string = '';
  NMI_TOKENIZATION_KEY: any;
  isGooglePayIntegrationDirectly: boolean = true;
  paymentCountryCode: string='US';
  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private activeRouter: ActivatedRoute,
    private smartPayAPI: SmartPayAPIService,
    private paymentAPI: PaymentAPIService,
    private service: SmartPaymentService,
    private renderer: Renderer2,
    public commonMethodService: CommonMethodService,
    private router: Router,
    private googlePayService: GooglePayService
  ) {}

  ngOnInit(): void {
    console.log('Payment page');
    this.activeRouter.data.subscribe((data) => {
      console.log(data);

      if (data.status === SMART_PAYMENT_STATUS.COMPLETED) {
        this.isLoading = false;
        this.isPaymentProcess = true;
        this.isPaymentDone = true;
        this.isErrorInPayment = true;
        this.errorType = 'ALREADY_PROCESSED';
      }
    });

    this.activeRouter.queryParamMap.subscribe((param) => {
      this.allParams = {
        uuid: param.get('UUID'),
        cmpId: param.get('cmpId'),
        amount: param.get('amount'),
        dvcId: param.get('dvcId'),
        createdBy: param.get('crtdBy'),
        cncy: param.get('cncy'),
        lat: param.get('lat'),
        lon: param.get('lon'),
      };
    });

    this.getSmartPayGatewayInfo();

    this.initialAmount = this.allParams.amount;
    if (+this.allParams.amount! <= 0) this.allParams.amount = '';
    if (!+this.initialAmount! && this.errorType != 'ALREADY_PROCESSED')
      this.editAmt = true;

    if (!this.isGooglePayIntegrationDirectly) {

      this.service._googlePayment$.subscribe((v: GooglePayResponse) => {
        if (v.error && v.error === -100) {
          alert('No methods supported');
        }

        if (v.token && v.paymentResponse) {
          setTimeout(() => {
            this.handleGooglePaymentResponse(
              v.token as string,
              v.paymentResponse as GooglePaymentResponse
            );
          }, 250);
        }
      });      
    }

    this.service._applePayment$.subscribe((v: ApplePayResponse) => {
      if (v.error && v.error === -100) {
        this.isGoogle = true;
        this.changeDetectorRef.detectChanges();
        ckGooglePay.enableGooglePay({ ...this.commonOption });
      }

      if (v.error) {
        console.log('\n Apple payment Error 👇 \n');
        console.log(v.error);
      }

      if (v.payment) {
        // console.log('\n Apple payment object 👇 \n');
        // console.log(v.payment);
        this.handleApplePaymentResponse(
          JSON.stringify(v.payment.token.paymentData),
          v.payment
        );
      }
    });

    return;
  }

  getSmartPayGatewayInfo() {
    const payload: CampaignDevice = {
      CampaignId: this.allParams.cmpId,
      currency: this.allParams.cncy,
      deviceId: this.allParams.dvcId,
    };

    this.smartPayAPI.getSmartPayGatewayInfo(payload).subscribe((res) => {

      if (this.isGooglePayIntegrationDirectly) {
        this.loadGPayJs(res);
      }
      else {
        this.paymentButton = (res?.gatewayName as string).toLowerCase();
        if (this.paymentButton == 'nmi') {
          this.NMI_TOKENIZATION_KEY = res.merchantID;
          this.loadCollectJs();
        }
        GooglePayRequest.setMerchantName(res?.orgName);
      }
    });
  }

  loadGPayJs(res:any): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';     
      script.onload = () => {

        this.googlePayService.setMerchantInfo(res?.merchantID, res?.orgName); //merchantId is fixed;
        this.googlePayService.setTokenizationSpecification(res.gatewayName, res.merchantID);

        this.paymentCountryCode = res.countryCode;
        this.googlePayService.setTransInfo(this.paymentCountryCode, this.allParams.cncy ?? 'USD', this.allParams.amount);
        var env = res.environment;
        const paymentsClient = this.googlePayService['getGooglePaymentsClient'](env);
        paymentsClient.isReadyToPay(this.googlePayService.getGoogleIsReadyToPayRequest())
        .then((response:any) => {
          if (response.result) {
            const button = paymentsClient.createButton({buttonType:'donate', onClick: () => this.GPayButtonClick(env)});
            document.getElementById('google-pay-button-container')?.appendChild(button);
          }
        }).catch((err:any) => console.error(err));        
      };
      document.body.appendChild(script);
    });
  }

  GPayButtonClick(env:string){
    
     this.googlePayService.loadPaymentData(env).then((paymentData:any) => {
          console.log('Payment Data:', paymentData);
          const dd = {
             //Email: '',            
          };
          this.payment(paymentData.paymentMethodData.tokenizationData.token, dd);
      }).catch((error:any) => {
        console.error('Payment failed:', error);
      });
  }

  loadCollectJs(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://secure.nmi.com/token/Collect.js';
      script.setAttribute('data-tokenization-key', this.NMI_TOKENIZATION_KEY);
      script.setAttribute('data-field-google-pay-selector', '#divGpay');
      script.setAttribute('data-field-apple-pay-selector', '#applepay');
      script.setAttribute(
        'data-field-google-pay-shipping-address-parameters-allowed-country-codes',
        'US,CA'
      );
      script.setAttribute(
        'data-field-google-pay-billing-address-parameters-format',
        'MIN'
      );
      script.onload = () => {
        this.initializeCollectJS();
      };
      document.body.appendChild(script);
    });
  }

  handleGooglePay(token: string) {
    // Now pass the token to Google Pay
    GooglePayRequest._payment.next({
      error: null,
      token: token, // Use the token from Collect.js
      paymentResponse: null,
    });
  }

  // Initialize CollectJS and configure the callback
  initializeCollectJS(): void {
    if (typeof CollectJS === 'undefined') {
      return;
    }

    CollectJS.configure({
      fields: {
        googlePay: {
          selector: '#divGpay',
          shippingAddressRequired: true,
          shippingAddressParameters: {
            phoneNumberRequired: true,
            allowedCountryCodes: ['US', 'CA'],
          },
          billingAddressRequired: true,
          billingAddressParameters: {
            phoneNumberRequired: true,
            format: 'MIN',
          },
          emailRequired: true,
          buttonType: 'donate',
          buttonLocale: 'en',
        },
      },
      price: this.allParams.amount,
      currency: 'USD',
      country: 'US',
      callback: (response: any) => {
        this.cardHolderName = response.wallet.billingInfo.firstName;
        const token = response.token;
        const dd = {
          Email: response.wallet.email,

          FirstName: response.wallet.firstName,
          LastName: response.wallet.lastName,
          CardHolderName: this.cardHolderName,

          Address: response.wallet.shippingInfo.address1,

          State: response.wallet.shippingInfo.state,

          AddressZip: response.wallet.shippingInfo.postalCode,

          Latitude: this.allParams.lat,
          Longitude: this.allParams.lon,
        };

        this.payment(token, dd);

        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'payment_token';
        input.value = response.token;
        var form = document.getElementsByTagName('form')[0];
        form.appendChild(input);
        form.submit();
      },
    });
  }

  ngAfterViewInit(): void {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
    console.log(this.allParams);

    setTimeout(() => {
      this.isLoading = false;
      this.amtInput.nativeElement.value = this.allParams.amount || '';
      setTimeout(() => {
        this.initApple();
      }, 100);
    }, 1000);
  }

  private initApple() {
    try {
      ckApplePay.enableApplePay({
        initFunction: 'ApplePaymentRequest.initAP',
        ...this.commonOption,
      });
    } catch (error) {
      console.log(error);
    }
  }

  handleGooglePaymentResponse(
    token: string,
    paymentResponse: GooglePaymentResponse
  ) {
    this.cardHolderName =
      paymentResponse.paymentData.paymentMethodData.info.billingAddress.name ||
      '';

    this.fullAddress = `${paymentResponse.paymentData.paymentMethodData.info.billingAddress.address1} ${paymentResponse.paymentData.paymentMethodData.info.billingAddress.administrativeArea} ${paymentResponse.paymentData.paymentMethodData.info.billingAddress.postalCode}`;

    this.methodDescription = `${paymentResponse.paymentData.paymentMethodData.info.cardNetwork} ${paymentResponse.paymentData.paymentMethodData.info.cardDetails}`;

    const nameArr = this.cardHolderName.split(' ');

    const firstName = nameArr.length !== 0 ? nameArr[0] : null;
    const lastName = nameArr.length !== 0 ? nameArr[1] || null : null;

    const dd = {
      Email: paymentResponse.paymentData.email,

      FirstName: firstName,
      LastName: lastName,
      CardHolderName: this.cardHolderName,

      Address:
        paymentResponse.paymentData.paymentMethodData.info.billingAddress
          .address1,

      State:
        paymentResponse.paymentData.paymentMethodData.info.billingAddress
          .administrativeArea,
      AddressZip:
        paymentResponse.paymentData.paymentMethodData.info.billingAddress
          .postalCode,

      Latitude: this.allParams.lat,
      Longitude: this.allParams.lon,
    };

    this.payment(btoa(token), dd);
  }

  handleApplePaymentResponse(
    token: string,
    paymentResponse: ApplePaymentResponse
  ) {
    try {
      this.cardHolderName =
        paymentResponse.token.paymentMethod?.displayName || '';

      const addressLines = paymentResponse.shippingContact?.addressLines
        ? paymentResponse.shippingContact?.addressLines?.join(' ')
        : '';

      this.fullAddress = `${addressLines} ${paymentResponse.shippingContact?.administrativeArea} ${paymentResponse.shippingContact?.postalCode}`;

      this.methodDescription = paymentResponse.token.paymentMethod?.displayName;

      const nameArr = this.cardHolderName?.split(' ');

      const firstName = nameArr.length !== 0 ? nameArr[0] : null;
      const lastName = nameArr.length !== 0 ? nameArr[1] || null : null;

      const dd = {
        Email: '',

        FirstName: firstName,
        LastName: lastName,
        CardHolderName: this.cardHolderName,

        Address: addressLines,
        State: paymentResponse.shippingContact?.administrativeArea,
        AddressZip: paymentResponse.shippingContact?.postalCode,

        Latitude: this.allParams?.lat,
        Longitude: this.allParams?.lon,
      };

      this.payment(btoa(token), dd);
    } catch (error) {
      console.log(error);
    }
  }

  getGooglePayMethod() {
    return 12;
  }

  getApplePayMethod() {
    return 13;
  }

  isApplePay() {
    return false;
  }

  updateAmount() {
    const queryParams: Params = { amount: this.allParams.amount };
    this.router.navigate([], {
      relativeTo: this.activeRouter,
      queryParams,
      queryParamsHandling: 'merge',
    });
    this.editAmt = false;
    this.amtInput.nativeElement.value = this.allParams.amount as string;
    if (this.isGoogle) {
      if (!this.isGooglePayIntegrationDirectly) {
        ckGooglePay.updateAmount();
      }
      else {
        this.googlePayService.setTransInfo(this.paymentCountryCode, this.allParams.cncy ?? 'USD', this.allParams.amount);
      }
    }
    else if (!this.isGoogle) ckApplePay.updateAmount();
    this.initialAmount = this.allParams.amount;
  }

  private updateStatus(statusId: number) {
    this.smartPayAPI
      .smartPay({
        payGUID: this.allParams.uuid as string,
        statusId: statusId,
        macAddress: this.allParams.dvcId as string,
        createdBy: this.allParams.createdBy as string,
        amount: this.allParams.amount as string,
      })
      .subscribe((res) => {});
  }

  private payment(token: string, obj: any) {
    const payload = {
      AccountId: '',
      Amount: this.allParams.amount,
      MacAddress: null,
      PaymentReasonId: null,
      PaymentDate: new Date().toISOString(),
      CampaignId: this.allParams.cmpId,
      currency: this.allParams.cncy,
      PaymentMethodId: 4,
      EntryTypeId: this.isGoogle
        ? this.getGooglePayMethod()
        : this.getApplePayMethod(),
      Email: null,
      CardHolderName: null,

      FirstName: null,
      LastName: null,
      Address: '',
      Zip: null,
      Phone: null,
      HouseNum: '',
      Street: null,
      Unit: null,
      City: null,
      State: null,
      AddressZip: null,
      PaymentDetails: null,
      PaymentRecurringModel: null,
      Latitude: this.allParams.lat,
      Longitude: this.allParams.lon,
      CCNum: token,
      Expiry: null,
      Cvv: null,
      Note: null,
      Recapcha: null,

      createdBy: this.allParams.createdBy,
      UniqueTransactionId: this.allParams.uuid,
      deviceId: this.allParams.dvcId,

      ...obj,
    };

    this.isPaymentProcess = true;
    this.isLoading = true;

    this.changeDetectorRef.detectChanges();

    this.paymentAPI.DevicePay(payload).subscribe(
      (res) => {
        this.isLoading = false;
        this.isPaymentDone = true;

        const isAllReadyExistError =
          res.responseTitle &&
          res.responseTitle !== 'Success !!' &&
          res.responseMessage &&
          res.responseMessage.length !== 0;

        if (res.errorResponse || isAllReadyExistError) {
          this.isErrorInPayment = true;

          if (
            res.responseTitle &&
            res.responseMessage &&
            res.responseMessage.length !== 0
          ) {
            this.errorType = 'ALREADY_EXIST';
          }
          this.errorResponseMsg = res.errorResponse;
          this.updateStatus(2);
          this.changeDetectorRef.detectChanges();
          return;
        }

        this.updateStatus(3);
        this.changeDetectorRef.detectChanges();
      },
      (err) => {
        this.isLoading = false;
        this.isPaymentDone = true;
        this.isErrorInPayment = true;
        this.changeDetectorRef.detectChanges();
        this.updateStatus(2);
      }
    );
  }

  editAmount(e: Event) {
    e.stopPropagation();
    this.editAmt = true;
    setTimeout(() => this.amountInput.nativeElement.focus(), 0);
  }

  resetAmount() {
    this.editAmt = false;
    this.allParams.amount = this.initialAmount;
  }

  checkError() {
    this.showError = +this.allParams.amount! <= 0;
  }
}
