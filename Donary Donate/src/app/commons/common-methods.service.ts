import { Injectable } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonMethodService {
  currencyClass = 'icon icon-dollar';
  currencyIcon = '$';
  reasonCurrencyClass = 'icon-content icon-dollar-content';
  error404: string = ''
  isHebrew: boolean = false;
  isGlobalLangObservable = new BehaviorSubject<boolean>(false);
  modalOptions: NgbModalOptions = {
    centered: true,
    backdrop: 'static',
    keyboard: true, //changed to true for escape button to work
    windowClass: 'drag_popup',
    // state:true
  };

  stateList = [
    { item_id: 'AL', item_text: 'Alabama' },
    { item_id: 'AK', item_text: 'Alaska' },
    { item_id: 'AZ', item_text: 'Arizona' },
    { item_id: 'AR', item_text: 'Arkansas' },
    { item_id: 'CA', item_text: 'California' },
    { item_id: 'CO', item_text: 'Colorado' },
    { item_id: 'CT', item_text: 'Connecticut' },
    { item_id: 'DE', item_text: 'Delaware' },
    { item_id: 'DC', item_text: 'District Of Columbia' },
    { item_id: 'FL', item_text: 'Florida' },
    { item_id: 'GA', item_text: 'Georgia' },
    { item_id: 'HI', item_text: 'Hawaii' },
    { item_id: 'ID', item_text: 'Idaho' },
    { item_id: 'IL', item_text: 'Illinois' },
    { item_id: 'IN', item_text: 'Indiana' },
    { item_id: 'IA', item_text: 'Iowa' },
    { item_id: 'KS', item_text: 'Kansas' },
    { item_id: 'KY', item_text: 'Kentucky' },
    { item_id: 'LA', item_text: 'Louisiana' },
    { item_id: 'ME', item_text: 'Maine' },
    { item_id: 'MD', item_text: 'Maryland' },
    { item_id: 'MA', item_text: 'Massachusetts' },
    { item_id: 'MI', item_text: 'Michigan' },
    { item_id: 'MN', item_text: 'Minnesota' },
    { item_id: 'MS', item_text: 'Mississippi' },
    { item_id: 'MO', item_text: 'Missouri' },
    { item_id: 'MT', item_text: 'Montana' },
    { item_id: 'NE', item_text: 'Nebraska' },
    { item_id: 'NV', item_text: 'Nevada' },
    { item_id: 'NH', item_text: 'New Hampshire' },
    { item_id: 'NJ', item_text: 'New Jersey' },
    { item_id: 'NM', item_text: 'New Mexico' },
    { item_id: 'NY', item_text: 'New York' },
    { item_id: 'NC', item_text: 'North Carolina' },
    { item_id: 'ND', item_text: 'North Dakota' },
    { item_id: 'OH', item_text: 'Ohio' },
    { item_id: 'OK', item_text: 'Oklahoma' },
    { item_id: 'OR', item_text: 'Oregon' },
    { item_id: 'PA', item_text: 'Pennsylvania' },
    { item_id: 'RI', item_text: 'Rhode Island' },
    { item_id: 'SC', item_text: 'South Carolina' },
    { item_id: 'SD', item_text: 'South Dakota' },
    { item_id: 'TN', item_text: 'Tennessee' },
    { item_id: 'TX', item_text: 'Texas' },
    { item_id: 'UT', item_text: 'Utah' },
    { item_id: 'VT', item_text: 'Vermont' },
    { item_id: 'VA', item_text: 'Virginia' },
    { item_id: 'WA', item_text: 'Washington' },
    { item_id: 'WV', item_text: 'West Virginia' },
    { item_id: 'WI', item_text: 'Wisconsin' },
    { item_id: 'WY', item_text: 'Wyoming' },
  ];

  constructor(private modalService: NgbModal) { }

  openPopup(component: any, specificModalOptions: any = null) {
    if (specificModalOptions) {
      return this.modalService.open(component, specificModalOptions);
    } else {
      return this.modalService.open(component, this.modalOptions);
    }
  }

  formatAmount(value: any, currency = 'USD') {
    if (value != null) {
      let defaultCurrency = currency;

      //let defaultCurrency="ILS"
      defaultCurrency =
        defaultCurrency == null || defaultCurrency == 'CAD'
          ? 'USD'
          : defaultCurrency;
      if (
        defaultCurrency == null ||
        defaultCurrency == 'USD' ||
        defaultCurrency == 'CAD'
      ) {
        this.currencyClass = 'icon icon-dollar';
        this.reasonCurrencyClass = 'icon-content icon-dollar-content';
        this.currencyIcon = '$';
      } else if (defaultCurrency == 'GBP') {
        this.currencyClass = 'icon icon-gbp';
        this.reasonCurrencyClass = 'icon-content icon-gbp-content';
        this.currencyIcon = '£';
      } else if (defaultCurrency == 'EUR') {
        this.currencyClass = 'icon icon-eur';
        this.reasonCurrencyClass = 'icon-content icon-eur-content';
        this.currencyIcon = '€';
      } else if (defaultCurrency == 'ILS') {
        this.currencyClass = 'icon icon-ils';
        this.reasonCurrencyClass = 'icon-content icon-ils-content';
        this.currencyIcon = '₪';
      }
      return Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: defaultCurrency,
      }).format(value);
    }

    return Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(0);
  }

  getCurrencyIcon(currency: string | null = 'USD') {
    if (currency == 'USD' || currency == 'CAD' || currency == null) return '$';
    else if (currency == 'GBP') return '£';
    else if (currency == 'EUR') return '€';
    else if (currency == 'ILS') return '₪';
    else return '$';
  }

  getProgressBarWidth(value: any) {
    if (!value) {
      return '0%';
    }

    if (value > 100) {
      return '100%';
    }

    return `${value}%`;
  }

  isToirem() {
    return window.location.host.includes('toirem.org');
  }

  isBaisHillel() {
    return window.location.pathname.includes('1802');
  }

  isDerechChaim() {
    return window.location.pathname.includes('D6454027F49D');
  }

  getMacAddress(teamId: string | number | null) {
    if (teamId) {
      return `${'1506'}${'*'}${teamId}${'*'}`;
    }

    return `${'1506'}`;
  }

  convertToNumber(value: any) {
    return value ? Number(value) : 0;
  }

  setGlobalLang(val: boolean) {
    this.isGlobalLangObservable.next(val);
  }

  getUSStateList() {
    return this.stateList;
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode == 46) {
      // Allow only 1 decimal point ('.')...

      if (event.target.value && event.target.value.indexOf('.') >= 0)
        return false;
      else return true;
    } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    } else {
      return true;
    }
  }
}
