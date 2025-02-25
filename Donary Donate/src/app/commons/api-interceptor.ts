import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare var $: any;
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private messagedisplayed!: boolean;

  constructor() {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const baseUrl = environment.baseUrl;

    if (!request.headers.has('Content-Type')) {
      request = request.clone({
        setHeaders: {
          //'content-type': 'application/json'
        },
      });
    }

    request = request.clone({
      headers: request.headers.set('Accept', 'application/json'),
    });
    if (request.url.toLowerCase().indexOf('shippingapi') === -1) {
      request = request.clone({ url: `${baseUrl}${request.url}` });
    } else {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/xml',
          Accept: 'text/xml',
        },
      });
    }

    if (request.url.toLowerCase().indexOf('i18n') != -1) {
      request = request.clone({
        url: request.url.includes('heb')
          ? '/assets/i18n/heb.json'
          : '/assets/i18n/en.json',
      });
    }
    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
        }
        this.messagedisplayed = false;
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(error);
      })
    );
  }
}
