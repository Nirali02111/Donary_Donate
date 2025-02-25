import { OnInit, Component, Renderer2 } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { PageRouteVariable } from 'src/app/commons/page-route-variable';
import { CampaignService } from 'src/app/services/campaign.service';
import { LocalStorageDataService } from 'src/app/shared/local-storage-data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-campaign-login',
  templateUrl: './campaign-login.component.html',
  styleUrls: ['./campaign-login.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule],
})
export class CampaignLoginComponent implements OnInit {
  loginFormGroup!: FormGroup;
  isSubmitted = false;
  isLoading = false;

  voucher_url: string = '/' + PageRouteVariable.validate_voucher_url;

  get CampaignNum() {
    return this.loginFormGroup.get('campaignNum');
  }

  get Last4OfPhone() {
    return this.loginFormGroup.get('last4OfPhone');
  }

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    private router: Router,
    private campaignService: CampaignService,
    private localStorageDataService: LocalStorageDataService
  ) {}

  ngOnInit() {
    this.loginFormGroup = this.fb.group({
      campaignNum: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),
      last4OfPhone: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),
    });
  }

  ngAfterViewInit() {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }

  login() {
    this.isSubmitted = true;
    if (this.loginFormGroup.invalid) {
      this.loginFormGroup.markAllAsTouched();
      return;
    }

    const data = this.localStorageDataService.getLoginUserData();

    const campaignName = this.localStorageDataService.getCampaignName();
    const campaignNum = this.localStorageDataService.getCampaignNum();

    if (data) {
      const message = `you are currently logged in as ${campaignName || ''} ${
        campaignNum || ''
      } are you sure you want to finish your session and login?`;

      const modalRef = Swal.fire({
        title: 'Warning...!',
        text: message,
        allowEscapeKey: false,
        allowOutsideClick: false,
        showCancelButton: true,
        showCloseButton: true,
        reverseButtons: true,
        focusCancel: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
      });

      modalRef.then((res) => {
        if (res.isConfirmed) {
          this.doLoginAction();
          return;
        }

        if (res.isDismissed) {
          this.router.navigate([this.voucher_url]);
          return;
        }
      });

      return;
    }

    this.doLoginAction();
  }

  private doLoginAction() {
    this.isLoading = true;
    this.campaignService
      .login({
        campaignNum: Number(this.CampaignNum?.value),
        last4OfPhone: this.Last4OfPhone?.value,
        key: environment.CAMPAIGN_LOGIN_API_KEY,
      })
      .subscribe(
        (res: any) => {
          if (!res) {
            Swal.fire('Error!...', 'Error');
            return;
          }

          this.localStorageDataService.setLoginUserDataandToken(res);
          this.localStorageDataService.setCampaignNum(
            Number(this.CampaignNum?.value)
          );
          this.router.navigate([this.voucher_url]);
        },
        (error) => {
          this.isLoading = false;
          console.log(error, 'error');
          Swal.fire('Error!...', error.error);
        }
      );
  }
}
