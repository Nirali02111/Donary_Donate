import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { take, catchError, filter, switchMap } from 'rxjs/operators';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CampaignService } from '../services/campaign.service';
import { LocalStorageDataService } from './local-storage-data.service';
import { CommonMethodService } from '../commons/common-methods.service';

const baseUrl = environment.baseUrl;

@Injectable()
export class HTTPInterceptor implements HttpInterceptor {
  landingPage_url: string = 'toirem.org';
  private refreshTokenInProgress = false;
  private refreshTokenSubject: Subject<any> = new BehaviorSubject<any>(null);

  constructor(
    private router: Router,
    private localstoragedataService: LocalStorageDataService,
    private campaignService: CampaignService,
    private commonMethodService: CommonMethodService
  ) {}

  isOpenUrl(request: HttpRequest<any>): boolean {
    return (
      request.url.toLowerCase().indexOf('auth') === -1 &&
      request.url.toLowerCase().indexOf('blob.core.windows.net') === -1
    );
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const accessToken = this.localstoragedataService.getloginUserAccessToken();

    if (this.isOpenUrl(request)) {
      request = request.clone({
        setHeaders: {
          Authorization: 'Bearer ' + accessToken,
        },
      });
    }

    if (
      request.url.toLowerCase().indexOf('api.ipify.org') === -1 &&
      request.url.toLowerCase().indexOf('blob.core.windows.net') === -1
    ) {
      request = request.clone({
        url: baseUrl + request.url,
      });
    }

    return next.handle(request).pipe(
      catchError((err) => {
        console.log(err, 'login err');
        if (err.status === 401) {
          const tokenexpired = err.headers.get('Token-Expired');
          if (tokenexpired != null && tokenexpired !== '') {
            return this.handle401Error(request, next);
          } else {
            this.redirectToHome();
          }
        } else {
          console.log(err);
        }

        throw err;
      })
    );
  }
  handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);
      const accessToken: any =
        this.localstoragedataService.getloginUserAccessToken();
      const refreshToken: any =
        this.localstoragedataService.getloginUserRefreshToken();
      const expiresIn = this.localstoragedataService.getExpiresIn();
      const loginUserID = this.localstoragedataService.getLoginUserId();
      this.localstoragedataService.setAccessToken(accessToken);
      this.localstoragedataService.setRefreshToken(refreshToken);
      this.localstoragedataService.setTokenExpiryTime(expiresIn);
      this.refreshTokenSubject.next(accessToken);
      return next.handle(this.addTokenHeader(request, accessToken));
    }

    return this.refreshTokenSubject.pipe(
      filter((token: any) => token !== null),
      take(1),
      switchMap((token: any) =>
        next.handle(this.addTokenHeader(request, token))
      )
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: 'Bearer ' + token,
      },
    });
  }
  redirectToHome() {
    this.localstoragedataService.deleteLoginUserDataandToken();
    this.router.navigate([this.landingPage_url]);
  }
}
