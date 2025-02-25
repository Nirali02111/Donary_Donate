import { Injectable } from '@angular/core';

export interface MagneticStripeCardData {
  isSwipe: boolean;
  cardNumber: string;
  expDate: string;
  firstName: string;
  lastName: string;
}

export interface MagneticStripeCardData2 {
  isSwipe: boolean;
  accountNumber: string;
  expirationYear: string;
  expirationMonth: string;
  track2AccountNumber: string;
  track2ExpirationYear: string;
  track2ExpirationMonth: string;

  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root',
})
export class CreditCardService {
  constructor() {}

  protected sixTeenMask: string = '0000-0000-0000-0000';
  protected fifTeenMask: string = '0000-0000-0000-000';
  protected amexMask: string = '0000-000000-00000';
  protected fourteenMask: string = '0000-000000-000099';

  getDefaultMask(isFifteen: boolean = false): string {
    return isFifteen ? this.fifTeenMask : this.sixTeenMask;
  }

  getAmexMask() {
    return this.amexMask;
  }

  getDinerMask(isFourteen: boolean = false): string {
    return isFourteen ? this.fourteenMask : this.sixTeenMask;
  }

  luhnCheck(cardNo: string): boolean {
    var s = 0;
    var doubleDigit = false;
    for (var i = cardNo.length - 1; i >= 0; i--) {
      var digit = +cardNo[i];
      if (doubleDigit) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      s += digit;
      doubleDigit = !doubleDigit;
    }
    return s % 10 == 0;
  }

  // valid only for 16 digits
  oldluhnCheck(sixteenDigitString: any) {
    var numSum = 0;
    var value;
    for (var i = 0; i < 16; ++i) {
      if (i % 2 == 0) {
        value = 2 * sixteenDigitString[i];
        if (value >= 10) {
          value = Math.floor(value / 10) + (value % 10);
        }
      } else {
        value = +sixteenDigitString[i];
      }
      numSum += value;
    }
    return numSum % 10 == 0;
  }

  parseMagneticStrip(cardstringVal: string): MagneticStripeCardData {
    const details1 = cardstringVal.split('^');
    if (details1.length === 0) {
      return {
        isSwipe: false,
        cardNumber: '',
        expDate: '',
        firstName: '',
        lastName: '',
      };
    }

    try {
      let cardNumber = details1[0];
      cardNumber = cardNumber.substring(2);

      const names = details1[1].split('/');
      const firstName = names[1];
      const lastName = names[0];

      let expDate = details1[2];
      expDate = expDate.substring(0, expDate.length - 1);
      expDate = expDate.substring(2, 4) + '/' + expDate.substring(0, 2);

      return {
        isSwipe: true,
        cardNumber,
        expDate,
        firstName,
        lastName,
      };
    } catch (error) {
      return {
        isSwipe: false,
        cardNumber: '',
        expDate: '',
        firstName: '',
        lastName: '',
      };
    }
  }

  extractCardDetails(data: string): MagneticStripeCardData2 {
    const track1 = data.split(';')[0]; // Track 1
    const track2 = data.split(';')[1]; // Track 2
    const track1Regex = /%B(\d+)\^([A-Z ]+)\/([A-Z ]+)\^(\d{2})(\d{2})/;
    const track2Regex = /;(\d+)=(\d{4})/;

    const track1Match = track1.match(track1Regex);
    const track2Match = track2.match(track2Regex);

    const cardData = {
      isSwipe: true,
      accountNumber: track1Match ? track1Match[1] : '',
      lastName: track1Match ? track1Match[2] : '',
      firstName: track1Match ? track1Match[3] : '',
      expirationYear: track1Match ? '20' + track1Match[4] : '',
      expirationMonth: track1Match ? track1Match[5] : '',
      track2AccountNumber: track2Match ? track2Match[1] : '',
      track2ExpirationYear: track2Match
        ? '20' + track2Match[2].substring(0, 2)
        : '',
      track2ExpirationMonth: track2Match ? track2Match[2].substring(2, 4) : '',
    };

    return cardData;
  }
}
