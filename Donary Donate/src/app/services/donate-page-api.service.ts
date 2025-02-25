import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';

export interface GetDonatePagePayload {
  macAddress: string;
  domain?: string;
}

export interface LstDonateReasonObj {
  donors: number;
  goal: number;
  number: number;
  parentId: null;
  raised: number;
  reasonId: number;
  reasonName: string;
  reasonNameJewish: string;
  goalReached: number | string;
  totalPayment?: number;
}

export interface LstDonorDonationObj {
  createdDate: string;
  createdDateTime: string;
  donor: string;
  paid: number;
  reasonId: number;
  reasonName: string;
  reasonNameJewish: string;
}

export interface LstEventAmountObj {
  number: number;
  text: string;
}

export interface LstSettingObj {
  name: string;
  settingId: number | null;
  value: string;
}

export interface LstGroupObj {
  donorsCount: number | null;
  goal: number | null;
  raised: number | null;
  reasonId: number | null;
  reasonName: string | null;
  reasonNameJewish: string | null;
  reasonNumber: number | null;
  totalPayment?: number;
}

export interface getSecurityQuestionResponse {
  questionGUID: string;
  questionHebrew: string;
  questionYiddish: string;
}

export interface GetDonatePageResponse {
  campaignBonusGoal: number;
  strcampaignBonusGoal: string;
  campaignDescription: string;
  campaignEndTime: string;
  campaignGoal: number;
  campaignImage: string;
  campaignImageBase64: any;
  bonusGoalPercentage: number;
  campaignName: string;
  campaignStartTime: string;
  fundRaisedPercent: number;
  lstDonateReason: Array<LstDonateReasonObj>;
  lstDonorDonation: Array<LstDonorDonationObj>;
  lstEventAmount: Array<LstEventAmountObj>;
  lstSetting: Array<LstSettingObj>;
  lstGroup: Array<LstGroupObj>;
  totalDonors: number | null;
  totalFundRaised: number;
}

export interface DonorByPhoneObj {
  AccountID: number;
  Address: string;
  Balance: number;
  City: string;
  CityStateZip: string;
  FullName: string;
  FullNameJewish: string;
  FirstName: string;
  LastName: string;
  HouseNum: string;
  Note: string;
  PhoneNumber: string;
  Prepaid: number;
  State: string;
  StreetName: string;
  UnitNum: string;
  Zip: string;
}

export interface DonorDonationObj {
  createdDate: string;
  createdDateTime: string;
  donor: string;
  paid: number;
  reasonId: number;
  reasonName: string;
  reasonNameJewish: string;
}

interface GetDonateDonors {
  lstDonorDonation: Array<DonorDonationObj>;
  totalDonors: number;
  totalFundRaised: number;
}

@Injectable({
  providedIn: 'root',
})
export class DonatePageAPIService {
  private version = 'v1/';
  private DONATE_PAGE_MAIN_URL = `${this.version}DonatePage`;
  private GET_DONATE_PAGE_DONORS_URL = `${this.DONATE_PAGE_MAIN_URL}/DonateDonors`;
  private GET_QUESTION_URL = `${this.DONATE_PAGE_MAIN_URL}/GetSecurityQuestion`;
  private GET_DONOR_LOOKUP_BY_PHONE_URL = `${this.DONATE_PAGE_MAIN_URL}/DonorLookupByPhone`;

  constructor(private http: HttpClient) {}

  geDonatePageData(
    queryParams: GetDonatePagePayload
  ): Observable<GetDonatePageResponse> {
    return this.http
      .get<GetDonatePageResponse>(this.DONATE_PAGE_MAIN_URL, {
        params: {
          ...queryParams,
        },
      })
      .pipe(
        map((response: GetDonatePageResponse) => {
          const lstDonateReason = response.lstDonateReason || [];
          const lstDonateReasonArray = lstDonateReason.map((o) => {
            const totalPayment =
              o.raised && o.goal && o.goal > 0 ? (o.raised / o.goal) * 100 : 0;

            return {
              ...o,
              totalPayment,
            };
          });

          const lstGroup = response.lstGroup || [];

          const lstGroupArray = lstGroup.map((o) => {
            const totalPayment =
              o.raised && o.goal && o.goal > 0 ? (o.raised / o.goal) * 100 : 0;

            return {
              ...o,
              totalPayment,
            };
          });

          return {
            ...response,
            lstDonateReason: lstDonateReasonArray,
            lstGroup: lstGroupArray,
          };
        })
      );
  }

  getDonateDonors(macAddress: string): Observable<GetDonateDonors> {
    return this.http
      .get<GetDonateDonors>(this.GET_DONATE_PAGE_DONORS_URL, {
        params: {
          macAddress,
        },
      })
      .pipe((response) => {
        return response;
      });
  }

  getSecurityQuestion(): Observable<getSecurityQuestionResponse> {
    return this.http
      .get<getSecurityQuestionResponse>(this.GET_QUESTION_URL)
      .pipe((response) => {
        return response;
      });
  }

  getDonorLookupByPhone(
    macAddress: string,
    phoneNumber: string
  ): Observable<string> {
    return this.http
      .post<string>(this.GET_DONOR_LOOKUP_BY_PHONE_URL, {
        MacAddress: macAddress,
        PhoneNumber: phoneNumber,
        ReturnType: 'JSON',
      })
      .pipe((response) => {
        return response;
      });
  }
}
