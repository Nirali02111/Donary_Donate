import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { CharityTokenService } from 'src/app/services/charity-token.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NgbModal,
  NgbModalOptions,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { PageRouteVariable } from 'src/app/commons/page-route-variable';
import { LocalStorageDataService } from 'src/app/shared/local-storage-data.service';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, delay } from 'rxjs/operators';
import { SkeletonLoaderComponent } from 'src/app/commons/modules/skeleton-loader/skeleton-loader-component/skeleton-loader.component';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-validate-vouchers',
  templateUrl: './validate-vouchers.component.html',
  styleUrls: ['./validate-vouchers.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgbModule,
    RouterModule,
    FormsModule,
    CurrencyPipe,
    ReactiveFormsModule,
    SkeletonLoaderComponent,
  ],
})
export class ValidateVouchersComponent implements OnInit {
  validateFormGroup!: FormGroup;
  scannedVouchers: Array<any> = [];
  invalidVouchers: Array<any> = [];
  totalScannedVouchers: number = 0;
  totalScannedAmount: number = 0;
  totalInvalidVoucher: number = 0;
  totalInvalidAmount: number = 0;
  buttonIsClicked: boolean = false;
  responseData: any;
  validatedVoucherArray: Array<any> = [];
  proccess_page_url = '/' + PageRouteVariable.proccess_url;
  isLoader: boolean = true;
  invalidTokenTip: string = 'Token already processed';
  tokenList: Array<any> = [];
  isTokenScanned: boolean = false;
  cannotScanVoucherMsg: string = 'Voucher is already scanned in the system, it can not be scanned twice.'
  @ViewChild('validationModal') validationModal!: any;

  @ViewChild('modalFocus') modalFocusInput!: ElementRef<HTMLInputElement>;

  get Brand() {
    return this.validateFormGroup.get('brandName');
  }

  get BarCode() {
    return this.validateFormGroup.get('scanData');
  }

  constructor(
    private charityTokenService: CharityTokenService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private localStorageDataService: LocalStorageDataService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.validateFormGroup = this.fb.group({
      brandName: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),
      scanData: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),
    });

    this.BarCode?.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), delay(500))
      .subscribe((result: any) => {

        if (this.Brand?.value === 'matbia') {
          if (this.isExist) {
            return;
          }

          this.validateMatbiaToken();
        }
        if (this.Brand?.value === 'pledger') {
          if (this.isExist) {
            return;
          }

          this.validatePledgerToken();
        }
      });
  }

  ngAfterViewInit() {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }

  get isExist() {
    const barcode = this.BarCode?.value;
    if (!barcode) {
      return false;
    }


    if (this.Brand?.value === 'ojc') {
      return (
        this.scannedVouchers &&
        this.scannedVouchers.length !== 0 &&
        this.scannedVouchers.find((sv) => sv.scanData == barcode)
      );
    }
    if (this.Brand?.value === 'matbia') {
      const token = barcode.split('-');

      return (
        this.scannedVouchers &&
        this.scannedVouchers.length !== 0 &&
        this.scannedVouchers.find((sv) => sv.token == token[0])
      );
    }
    if (this.Brand?.value === 'pledger') {

      return (
        this.scannedVouchers &&
        this.scannedVouchers.length !== 0 &&
        this.scannedVouchers.find((sv) => sv.token == barcode)
      );
    }
  }

  scanVouchers() {
    const barcode = this.BarCode?.value;
    if (this.isExist) {
      return;
    }

    if (this.validateFormGroup.invalid) {
      this.validateFormGroup.markAllAsTouched();
      return;
    }

    if (this.BarCode?.value && this.Brand?.value) {
      if (this.Brand?.value === 'ojc' && barcode.length === 20) {
        this.isTokenScanned = this.tokenList.includes(barcode);
        this.tokenList.push(this.BarCode?.value);

        let obj = {
          brand: this.Brand?.value,
          scanData: this.BarCode?.value,
          tokenNumber: '',
          tokenAmount: 0,
        };
        this.charityTokenService.validateToken(obj).subscribe(
          (res) => {
            if (res) {
              this.isLoader = false;
              this.responseData = res;
              this.isTokenScanned = false;
              if (obj.brand == 'ojc') {
                res.scanData = obj.scanData;
              }
              this.validatedVoucherArray.push(res);

              if (res.status === 'Generated' || res.status === 'Valid') {
                this.scannedVouchers.unshift({
                  brandName: res.brand,
                  token: res.tokenNumber,
                  amount: res.amount,
                  scanData: obj.scanData,
                });
                this.totalScannedAmount += res.amount;
              } else if (res.status !== 'Generated') {
                if (res.status !== 'Processed') {
                  this.invalidTokenTip = res.message;
                } else if (res.status === 'Processed') {
                  this.invalidTokenTip = 'Token already processed';
                }

                this.invalidVouchers.push({
                  brandName: res.brand,
                  token: res.tokenNumber,
                  amount: res.amount,
                  scanData: obj.scanData,
                  invalidTokenTip: this.invalidTokenTip
                });
                this.totalInvalidAmount += res.amount;
                this.openModal();
              }
              this.validateFormGroup.reset();
              this.Brand?.patchValue(obj.brand);
            }
          },
          (error) => {
            console.log(error, 'error');
            Swal.fire('Error!...', error.error);
          }
        );
        this.totalScannedVouchers = this.scannedVouchers.length;
        this.totalInvalidVoucher = this.invalidVouchers.length;
      }
    }
  }

  openModal() {
    const option: NgbModalOptions = {
      centered: true,

      backdrop: 'static',
      keyboard: false,

      windowClass: 'modal-campaign',
      size: 'sm',
      container: 'main',
    };

    const modalRef = this.modalService.open(this.validationModal, option);

    modalRef.shown.subscribe(() => {
      this.modalFocusInput?.nativeElement.focus();
    });
  }

  onSubmit() {
    if (this.buttonIsClicked) {
      return
    }
    this.buttonIsClicked = true;
    let groupByarray = this.groupBy(this.scannedVouchers, 'brandName');

    this.localStorageDataService.setVoucherData(groupByarray);
    this.router.navigate([this.proccess_page_url]);
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

  validateMatbiaToken() {
    if (this.validateFormGroup.invalid) {
      this.validateFormGroup.markAllAsTouched();
      return;
    }

    const barcode = this.BarCode?.value;
    let tokenNumber = '';
    let tokenAmount = 0;
    if (barcode.indexOf('-') !== -1) {
      tokenNumber = barcode.split('-')[0];
      tokenAmount = barcode.split('-')[1];
    }

    let obj = {
      brand: this.Brand?.value,
      scanData: '',
      tokenNumber: tokenNumber,
      tokenAmount: tokenAmount,
    };

    this.charityTokenService.validateToken(obj).subscribe(
      (res) => {
        if (res) {
          this.isLoader = false;
          this.responseData = res;
          this.isTokenScanned = false;
          this.validatedVoucherArray.push(res);
          if (res.status === 'Generated') {
            this.scannedVouchers.push({
              brandName: res.brand,
              token: res.tokenNumber,
              amount: res.amount,
            });
            this.totalScannedAmount += res.amount;
          } else if (res.status !== 'Generated') {
            if (res.status !== 'Processed') {
              this.invalidTokenTip = res.message;
            } else if (res.status === 'Processed') {
              this.invalidTokenTip = 'Token already processed';
            }

            this.invalidVouchers.unshift({
              brandName: res.brand,
              token: res.tokenNumber,
              amount: res.amount,
              invalidTokenTip: this.invalidTokenTip
            });
            this.totalInvalidAmount += res.amount;
            this.openModal();
          }

          this.validateFormGroup.reset();
          this.Brand?.patchValue(obj.brand);
        }
      },
      (error) => {
        console.log(error, 'error');
        Swal.fire('Error!...', error.error);
      }
    );
    this.totalScannedVouchers = this.scannedVouchers.length;
    this.totalInvalidVoucher = this.invalidVouchers.length;
  }
  validatePledgerToken() {
    if (this.validateFormGroup.invalid) {
      this.validateFormGroup.markAllAsTouched();
      return;
    }

    const barcode = this.BarCode?.value;


    let obj = {
      brand: this.Brand?.value,
      scanData: barcode,
      tokenNumber: null,
      tokenAmount: null,
    };

    this.charityTokenService.validateToken(obj).subscribe(
      (res) => {
        if (res) {
          this.isLoader = false;
          this.responseData = res;
          this.isTokenScanned = false;

          this.validatedVoucherArray.push(res);

          if (res.status === 'Valid') {
            if (res.message === this.cannotScanVoucherMsg) {
              //tooltip error
              this.invalidTokenTip = 'Token already processed'
              this.invalidVouchers.unshift({
                brandName: res.brand,
                token: res.tokenNumber,
                amount: res.amount,
                invalidTokenTip: this.invalidTokenTip
              });

              this.totalInvalidAmount += res.amount;
              this.openModal();

            }
            else {
              // display voucher in valid  
              this.scannedVouchers.push({
                brandName: res.brand,
                token: res.tokenNumber,
                amount: res.amount,
              });
              this.totalScannedAmount += res.amount;
            }



          } else if (res.status === 'Error') {
            //tooltip error
            this.invalidTokenTip = res.message ? res.message : 'Error'
            this.invalidVouchers.unshift({
              brandName: res.brand,
              token: res.tokenNumber,
              amount: res.amount,
              invalidTokenTip: this.invalidTokenTip
            });

            this.totalInvalidAmount += res.amount;
            this.openModal();



          }


          this.validateFormGroup.reset();
          this.Brand?.patchValue(obj.brand);





        }
      },
      (error) => {
        console.log(error, 'error');
        Swal.fire('Error!...', error.error);
      }
    );
    this.totalScannedVouchers = this.scannedVouchers.length;
    this.totalInvalidVoucher = this.invalidVouchers.length;

  }
}
