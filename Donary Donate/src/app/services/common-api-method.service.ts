import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GetCurrenciesObj {
  currencyId: number | null;
  currencyName: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CommonAPIMethodService {
  private version = 'v1/';
  private COMMON_METHOD_MAIN_URL = 'common';

  private GET_CURRENCIES_URL = `${this.version}${this.COMMON_METHOD_MAIN_URL}/GetCurrencies`;

  constructor(private http: HttpClient) {}

  getCurrencies(eventGuid?: string): Observable<Array<GetCurrenciesObj>> {
    let params = new HttpParams();

    if (eventGuid) {
      params = params.set('eventGuid', eventGuid);
    }

    return this.http
      .get<Array<GetCurrenciesObj>>(this.GET_CURRENCIES_URL, {
        params: params,
      })
      .pipe((response) => {
        return response;
      });
  }
}
