import { Injectable } from '@angular/core';

import { environment } from './../../environments/environment';
import { DocumentRef, WindowRef } from '../@models/Platform';

@Injectable()
abstract class MapsAPILoader {
  abstract load(): Promise<void>;
}

@Injectable()
export class GoogleMapService extends MapsAPILoader {
  protected _scriptLoadingPromise!: Promise<void>;
  protected _config!: any;
  protected _windowRef: WindowRef;
  protected _documentRef: DocumentRef;
  protected readonly _SCRIPT_ID: string = 'donaryGoogleMapsApiScript';
  protected readonly callbackName: string = `donaryLazyMapsAPILoader`;
  constructor(w: WindowRef, d: DocumentRef) {
    super();

    this._windowRef = w;
    this._documentRef = d;
  }

  load(): Promise<void> {
    const window = this._windowRef.getNativeWindow() as any;
    if (window.google && window.google.maps) {
      // Google maps already loaded on the page.
      return Promise.resolve();
    }

    if (this._scriptLoadingPromise) {
      return this._scriptLoadingPromise;
    }
    const scriptOnPage = this._documentRef.getNativeDocument().getElementById(this._SCRIPT_ID);
    if (scriptOnPage) {
      this._assignScriptLoadingPromise(scriptOnPage);
      return this._scriptLoadingPromise;
    }

    const script = this._documentRef.getNativeDocument().createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.id = this._SCRIPT_ID;
    script.src = this._getScriptSrc(this.callbackName);
    this._assignScriptLoadingPromise(script);
    this._documentRef.getNativeDocument().body.appendChild(script);
    return this._scriptLoadingPromise;
  }

  private _assignScriptLoadingPromise(scriptElem: HTMLElement) {
    this._scriptLoadingPromise = new Promise((resolve, reject) => {
      this._windowRef.getNativeWindow()[this.callbackName] = () => {
        resolve();
      };

      scriptElem.onerror = (error: any) => {
        reject(error);
      };
    });
  }

  protected _getScriptSrc(callbackName: string): string {
    const key = environment.GOOGLE_MAP_API_KEY;
    return `https://maps.googleapis.com/maps/api/js?key=AIzaSyAvMry9t3AX1S2FglQsBxvCsvGKHNJXCCU&libraries=places&callback=${callbackName}`;
  }
}
