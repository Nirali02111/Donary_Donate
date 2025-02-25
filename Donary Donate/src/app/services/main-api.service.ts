import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

interface Attachment {
  FileName: string;
  FileBase64: string;
}

export interface MainContactUSPayload {
  FullName: string;
  EmailAddress: string;
  PhoneNumber: string;
  Subject: string;
  Body: string;
  Attachments: Array<Attachment>;
}

@Injectable({
  providedIn: "root",
})
export class MainAPIService {
  version = "v1/";
  MAIN_URL = "Main";

  private MAIN_CONTACT_US_URL = `${this.version}${this.MAIN_URL}/ContactUs`;

  constructor(private http: HttpClient) {}

  contactUs(formdata: MainContactUSPayload): Observable<any> {
    return this.http
      .post(this.MAIN_CONTACT_US_URL, formdata)
      .pipe((response) => {
        return response;
      });
  }
}
