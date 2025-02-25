import { Component, OnInit, Renderer2 } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageDataService } from 'src/app/shared/local-storage-data.service';
import { PageRouteVariable } from 'src/app/commons/page-route-variable';
import { SkeletonLoaderComponent } from 'src/app/commons/modules/skeleton-loader/skeleton-loader-component/skeleton-loader.component';

@Component({
  selector: 'app-voucher-success',
  templateUrl: './voucher-success.component.html',
  styleUrls: ['./voucher-success.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    SkeletonLoaderComponent,
  ],
})
export class VoucherSuccessComponent implements OnInit {
  login_page_url = '/' + PageRouteVariable.campaign_login_url;

  notProccessedList: any = [];
  totalSubmittedCount: number = 0;
  totalSuccessedCount: number = 0;
  totalNotProccessedCount: number = 0;

  totalSubmittedAmount: number = 0;
  totalProccessedAmount: number = 0;
  totalNotProccessedAmount: number = 0;

  matbiaSuccessCount: number = 0;
  matbiaSuccessAmount: number = 0;

  OjcSuccessCount: number = 0;
  OjcSuccessAmount: number = 0;
  OjcErrorCount: number = 0;
  OjcErrorAmount: number = 0;

  pledgeSuccessCount: number = 0;
  pledgeSuccessAmount: number = 0;
  pledgeErrorCount: number = 0;
  pledgeErrorAmount: number = 0;

  constructor(
    private localStorageDataService: LocalStorageDataService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.getNotProccessedData();
    this.logoutAt();
  }

  ngAfterViewInit() {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }

  get proccessData() {
    return this.localStorageDataService.getProccessData();
  }

  getNotProccessedData() {
    if (this.proccessData && this.proccessData.length !== 0) {
      this.proccessData.find((val: any) => {
        if (
          val.status == 'Error' &&
          val.processedTokensCount == null &&
          val.notProcessedTokensCount == null
        ) {
          Swal.fire('Error!...', val.message);
        }
        this.totalSuccessedCount += val.processedTokensCount;
        this.totalNotProccessedCount += val.notProcessedTokensCount;
        this.totalSubmittedCount =
          this.totalSuccessedCount + this.totalNotProccessedCount;

        this.totalProccessedAmount += val.processedTokensAmount;
        this.totalNotProccessedAmount += val.notProcessedTokensAmount;
        this.totalSubmittedAmount =
          this.totalProccessedAmount + this.totalNotProccessedAmount;

        if (val.brand === 'Matbia') {
          this.matbiaSuccessAmount += val.processedTokensAmount;
          this.matbiaSuccessCount += val.processedTokensCount;
        }
        if (val.brand === 'OJC') {
          this.OjcSuccessAmount += val.processedTokensAmount;
          this.OjcSuccessCount += val.processedTokensCount;

          this.OjcErrorAmount += val.notProcessedTokensAmount;
          this.OjcErrorCount += val.notProcessedTokensCount;
        }
        if (val.brand === 'Pledger') {
          this.pledgeSuccessAmount += val.processedTokensAmount;
          this.pledgeSuccessCount += val.processedTokensCount;

          this.pledgeErrorAmount += val.notProcessedTokensAmount;
          this.pledgeErrorCount += val.notProcessedTokensCount;
        }
        (val.notProcessed || []).map((data: any) => {
          this.notProccessedList.push({
            brand: val.brand,
            tokenNumber: data.tokenNumber,
            amount: data.amount,
            message: data.message,
          });
        });
      });
    }
  }

  private logoutAt() {
    setTimeout(() => {
      this.localStorageDataService.deleteLoginUserDataandToken();
    }, 500);
  }
}
