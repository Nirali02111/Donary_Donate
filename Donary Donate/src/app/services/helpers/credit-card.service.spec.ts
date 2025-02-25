import { TestBed, waitForAsync } from '@angular/core/testing';

import { CreditCardService } from './credit-card.service';

const stringOne =
  '%B4263982640269299^FISCH/JOEL^24062011906875870000000000000000?;4263982640269299=240620119067941700000?+?';

const stringTwo =
  '%B8628241406803648^ORG/MATBIA^28123214321987?;8628241406803648=2812321432187?';

const stringThree =
  '%B1234567890123456^DOE/JOHN^24051200000000000000000?;1234567890123456=24051210000000000000?';
const stringFour =
  '%B1234567890123456^DOE/JOHN^00000000000000000000000?;1234567890123456=00000000000000000000?';
const stringFive = '%B1234567890123456^DOE/JOHN^24051200000000000000000?';

const stringSix = `%B9876543210987654^O'CONNOR/SARAH-JANE^25121200000000000000000?;9876543210987654=25121210000000000000?`;
const stringSeven =
  '%BINVALIDDATA^0000000000000000^00000000000000000000000?;0000000000000000=00000000000000000000?';
const stringEight = ';9876543210987654=26072210000000000000?';

describe('CreditCardService', () => {
  let service: CreditCardService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({});
  }));

  beforeEach(() => (service = TestBed.inject(CreditCardService)));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be swipe', () => {
    const values = service.parseMagneticStrip(stringOne);

    expect(values.isSwipe).toEqual(true);
    expect(values.cardNumber).toEqual('4263982640269299');
    expect(values.firstName).toEqual('JOEL');
    expect(values.lastName).toEqual('FISCH');
  });

  it('should be swipe string two', () => {
    const values = service.parseMagneticStrip(stringTwo);

    expect(values.isSwipe).toEqual(true);
    expect(values.cardNumber).toEqual('8628241406803648');
    expect(values.firstName).toEqual('MATBIA');
    expect(values.lastName).toEqual('ORG');
  });

  it('should be swipe string three', () => {
    const values = service.parseMagneticStrip(stringThree);

    expect(values.isSwipe).toEqual(true);
    expect(values.cardNumber).toEqual('1234567890123456');
    expect(values.firstName).toEqual('DOE');
    expect(values.lastName).toEqual('JOHN');
  });

  it('should be swipe string one in to new Method', () => {
    const values = service.extractCardDetails(stringOne);

    expect(values.isSwipe).toEqual(true);
    expect(values.accountNumber).toEqual('4263982640269299');
    expect(values.firstName).toEqual('JOEL');
    expect(values.lastName).toEqual('FISCH');
  });

  it('should be swipe string two in to new Method', () => {
    const values = service.extractCardDetails(stringTwo);

    expect(values.isSwipe).toEqual(true);
    expect(values.accountNumber).toEqual('8628241406803648');
    expect(values.firstName).toEqual('MATBIA');
    expect(values.lastName).toEqual('ORG');
  });
});
