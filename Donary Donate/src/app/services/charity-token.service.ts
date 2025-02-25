import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageDataService } from '../shared/local-storage-data.service';

export interface tokenValidatePayload {
  brand: string,
  scanData: string,
  tokenNumber: string | null,
  tokenAmount: number | null
}

export interface tokenValidateResponse {
  isImageRequired: boolean,
  brand: string,
  tokenNumber: number,
  amount: number,
  status: string,
  message: string,
  scanData: string,
}

@Injectable({
  providedIn: 'root'
})
export class CharityTokenService {
  version = 'v1';
  CHARITY_TOKEN_URL = `${this.version}/CharityToken`;
  VALIDATE_URL = this.CHARITY_TOKEN_URL + '/Validate';
  PROCCESS_URL = this.CHARITY_TOKEN_URL + '/Process';

  constructor(
    private http: HttpClient,
    private localStorageDataService: LocalStorageDataService
  ) { }




  validateToken(formData: tokenValidatePayload): Observable<tokenValidateResponse> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.localStorageDataService.getloginUserAccessToken(),
        'Accept': 'application/json'
      })
    };
    return this.http.post<tokenValidateResponse>(this.VALIDATE_URL, formData, httpOptions);
  }

  proccessToken(formData: any): Observable<any> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.localStorageDataService.getloginUserAccessToken(),
        'Accept': 'application/json'
      })
    };
    return this.http.post(this.PROCCESS_URL, formData, httpOptions);
  }
}
