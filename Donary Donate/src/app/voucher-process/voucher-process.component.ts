import { Component, OnInit, Renderer2 } from '@angular/core';
import { LocalStorageDataService } from 'src/app/shared/local-storage-data.service';
import { CharityTokenService } from 'src/app/services/charity-token.service';
import { Router, RouterModule } from '@angular/router';
import { PageRouteVariable } from 'src/app/commons/page-route-variable';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SkeletonLoaderComponent } from 'src/app/commons/modules/skeleton-loader/skeleton-loader-component/skeleton-loader.component';
import { NgFor, NgIf } from '@angular/common';

interface token {
  scanData: string | any;
  tokenNumber: string | any;
  amount: string | any;
}

interface NewType {
  brand: string;
  tokens: Array<token>;
  createdBySource: any | null
}

@Component({
  selector: 'app-voucher-process',
  templateUrl: './voucher-process.component.html',
  styleUrls: ['./voucher-process.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgbModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SkeletonLoaderComponent,
  ],
})
export class VoucherProcessComponent implements OnInit {
  success_page_url = '/' + PageRouteVariable.success_url;
  isResponse: boolean = false;
  brandDetailsList: any = [];
  processedBrands: any = [];
  isMatbiaBrand: boolean = true;
  isOjcBrand: boolean = true;
  currentIndex: number = 0;
  isMatbiaCheck: boolean = false;
  isOJCCheck: boolean = false;
  isPledgerBrand: boolean = true
  isPledgerCheck: boolean = false

  constructor(
    private localStorageDataService: LocalStorageDataService,
    private charityTokenService: CharityTokenService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {

    this.ProccessVoucher(this.voucherData);
  }

  ngAfterViewInit() {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }

  get voucherData() {

    return this.localStorageDataService.getVoucherData();
  }

  ProccessVoucher(data: any) {

    let processDataArray: NewType[] | any = [];
    let obj;
    let vourcherObj = data;
    let vourcherDataArray = Object.keys(vourcherObj).map((brand) => ({
      brand,
      token: vourcherObj[brand],
    }));

    for (let i = 0; i < vourcherDataArray.length; i++) {
      let processDataObj = [];
      if (vourcherDataArray[i].brand === 'Matbia') {
        for (let j = 0; j < vourcherDataArray[i].token.length; j++) {
          if (
            vourcherDataArray[i].token[j].token != 0 &&
            (vourcherDataArray[i].token[j].amount != 0 ||
              vourcherDataArray[i].token[j].amount != null)
          ) {
            processDataObj.push({
              scanData: '',
              tokenNumber: vourcherDataArray[i].token[j].token,
              amount: vourcherDataArray[i].token[j].amount,
            });
          }
        }
        obj = {
          brand: vourcherDataArray[i].brand,
          tokens: processDataObj,
        };
        processDataArray.push(obj);
      } else if (vourcherDataArray[i].brand === 'OJC') {
        for (let j = 0; j < vourcherDataArray[i].token.length; j++) {
          processDataObj.push({
            scanData: vourcherDataArray[i].token[j].scanData,
            tokenNumber: vourcherDataArray[i].token[j].token,
            amount: vourcherDataArray[i].token[j].amount,
          });
        }
        obj = {
          brand: vourcherDataArray[i].brand,
          tokens: processDataObj,
        };
        processDataArray.push(obj);
      }
      else if (vourcherDataArray[i].brand === 'Pledger') {
        //need to check here
        for (let j = 0; j < vourcherDataArray[i].token.length; j++) {

          processDataObj.push({
            scanData: vourcherDataArray[i].token[j].token,
            tokenNumber: null,
            amount: null,
          });
        }
        obj = {
          brand: vourcherDataArray[i].brand,
          tokens: processDataObj,
          createdBySource: null
        };
        processDataArray.push(obj);
      }
    }
    this.callProccessAPI(processDataArray);
  }

  callProccessAPI(payload: any) {

    for (let i = 0; i < payload.length; i++) {
      setTimeout(() => {
        this.processTokenLoad(payload[i]);
      }, i * 3000);
    }
    setTimeout(() => {
      this.router.navigate([this.success_page_url]);
    }, 9000);
  }

  processTokenLoad(payload: any) {
    this.charityTokenService.proccessToken(payload).subscribe(
      (res) => {
        if (res) {

          this.processedBrands.push(res.brand);
          this.brandDetailsList.push(res);
          this.localStorageDataService.setProccessData(this.brandDetailsList);
          this.showNextItem();
          setTimeout(() => {
            if (res.brand === 'Matbia') {
              this.isMatbiaBrand = false;
              this.isMatbiaCheck = true;
            }
            if (res.brand === 'OJC') {
              this.isOjcBrand = false;
              this.isOJCCheck = true;
            }
            if (res.brand === 'Pledger') {
              this.isPledgerBrand = false;
              this.isPledgerCheck = true;
            }
          }, 3000);
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  showNextItem() {
    if (this.currentIndex < this.processedBrands.length) {
      setTimeout(() => {
        this.currentIndex++;
        this.showNextItem();
      }, 1000);
    }
  }

  groupBy(array: any[], property: string): { [key: string]: any[] } {
    return array.reduce((acc, obj) => {
      const key = obj[property];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }
}
