import { Injectable } from '@angular/core';

export interface CampaignLoginUserObj {
  toiremUserId: number;
  accountId: number;
  campaignId: number;
  campaignName: string;
  friendlyName: string;
  eventGuId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: null;
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageDataService {
  private accessTokenKey = 'accesstoken';
  private refreshTokenKey = 'refreshtoken';
  private expiresInKey = 'expiresIn';

  private toiremUserId = 'userId';
  private accountId = 'accountId';
  private campaignId = 'campaignId';
  private campaignName = 'campaignName';
  private friendlyName = 'friendlyName';
  private eventGuId = 'eventGuId';
  private allLoginUsersKey = 'all_users';
  private loginUserKey = 'login_user';
  private campaignNum = 'campaignNum';
  private voucherData = 'voucherData';
  private proccessData = 'proccessData';

  constructor() {}

  setLoginUserDataandToken(userdata: any) {
    localStorage.setItem(this.allLoginUsersKey, JSON.stringify(userdata));
    localStorage.setItem(this.loginUserKey, JSON.stringify(userdata));
    localStorage.setItem(this.accessTokenKey, userdata.accessToken);
    localStorage.setItem(this.refreshTokenKey, userdata.refreshToken);
    localStorage.setItem(this.toiremUserId, userdata.toiremUserId);
    localStorage.setItem(this.accountId, userdata.accountId);
    localStorage.setItem(this.campaignId, userdata.campaignId);
    localStorage.setItem(this.campaignName, userdata.campaignName);
    localStorage.setItem(this.friendlyName, userdata.friendlyName);
    localStorage.setItem(this.eventGuId, userdata.eventGuId);
    localStorage.setItem(this.expiresInKey, userdata.expiresIn);
  }

  removeUserData() {
    localStorage.removeItem(this.allLoginUsersKey);
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.toiremUserId);
    localStorage.removeItem(this.accountId);
    localStorage.removeItem(this.campaignId);
    localStorage.removeItem(this.campaignName);
    localStorage.removeItem(this.friendlyName);

    localStorage.removeItem(this.eventGuId);
    localStorage.removeItem(this.expiresInKey);
  }

  setAccessToken(accessToken: string) {
    localStorage.setItem(this.accessTokenKey, accessToken);
  }

  getloginUserAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  setRefreshToken(refreshToken: string) {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  getloginUserRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getAllUsers(): Array<CampaignLoginUserObj> {
    const data = localStorage.getItem(this.allLoginUsersKey);
    if (data && data !== 'null') {
      return JSON.parse(data);
    }
    return [];
  }

  deleteLoginUserDataandToken() {
    localStorage.clear();
  }

  getLoginUserId() {
    return localStorage.getItem(this.toiremUserId);
  }

  setCampaignName(campaignName: string) {
    localStorage.setItem(this.campaignName, campaignName);
  }

  getCampaignName() {
    return localStorage.getItem(this.campaignName);
  }

  setTokenExpiryTime(expiryTime: any) {
    localStorage.setItem(this.expiresInKey, expiryTime);
  }

  getExpiresIn() {
    return localStorage.getItem(this.expiresInKey);
  }

  setCampaignNum(campaignNum: any) {
    localStorage.setItem(this.campaignNum, campaignNum);
  }

  getCampaignNum() {
    return localStorage.getItem(this.campaignNum);
  }

  getLoginUserData() {
    const data = localStorage.getItem(this.loginUserKey);
    if (data && data !== 'null') {
      try {
        return JSON.parse(data);
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  setVoucherData(voucherArr: any) {
    localStorage.setItem(this.voucherData, JSON.stringify(voucherArr));
  }

  getVoucherData() {
    const data = localStorage.getItem(this.voucherData);

    if (data && data !== 'null') {
      try {
        return JSON.parse(data);
      } catch (error) {
        return [];
      }
    }

    return [];
  }

  setProccessData(proccessArr: any) {
    localStorage.setItem(this.proccessData, JSON.stringify(proccessArr));
  }

  getProccessData() {
    const data = localStorage.getItem(this.proccessData);
    if (data && data !== 'null') {
      try {
        return JSON.parse(data);
      } catch (error) {
        return [];
      }
    }
    return [];
  }
}
