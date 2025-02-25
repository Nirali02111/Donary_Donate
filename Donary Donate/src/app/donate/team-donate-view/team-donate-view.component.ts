import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Injectable,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject, } from 'rxjs';
import { debounceTime, delay, map, switchMap, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { Guid } from 'guid-typescript';

import { CommonMethodService } from 'src/app/commons/common-methods.service';

import {
  DonatePageAPIService,
  DonorByPhoneObj,
  GetDonatePageResponse,
  LstDonateReasonObj,
  LstDonorDonationObj,
  LstGroupObj,
  LstSettingObj,
} from 'src/app/services/donate-page-api.service';
import { CreditCardService } from 'src/app/services/helpers/credit-card.service';

import { swingTrigger } from 'src/app/commons/animation';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  CommonAPIMethodService,
  GetCurrenciesObj,
} from 'src/app/services/common-api-method.service';
import { TranslateService } from '@ngx-translate/core';
import { PaymentService } from 'src/app/services/payment.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
const compare = (v1: string | number, v2: string | number) =>
  v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

function sort(list: any[], column: string, direction: string): any[] {
  if (direction === '' || column === '') {
    return list;
  }

  return [...list].sort((a, b) => {
    const res = compare(a[column], b[column]);
    return direction === 'asc' ? res : -res;
  });
}

interface teamAmtObj {
  value: string;
  index: number;
}

export type SortColumn = string | Function;
export type SortDirection = 'asc' | 'desc' | '';
export type SortOption = {
  key: string;
  value: string;
  sortByFunction: boolean;
};

interface TabPanelSettingObj {
  showDonorPanel: boolean;
  showTeamPanel: boolean;
  showGroupPanel: boolean;
  showHeader: boolean;
  expandTeamToShowDonors: boolean;
}
declare var $: any;
@Injectable()
export class DataFilterService<T> {
  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _observable$ = new BehaviorSubject<T[]>([]);
  private _state: {
    searchTerm: string;
    sortColumn: string | Function;
    sortDirection: string;
  } = {
      searchTerm: '',
      sortColumn: '',
      sortDirection: '',
    };

  private arrayList: Array<T> = [];

  constructor() {
    this._search$
      .pipe(
        tap(() => this._loading$.next(true)),
        debounceTime(200),
        switchMap(() => this._search()),
        delay(200),
        tap(() => this._loading$.next(false))
      )
      .subscribe((result: any) => {
        this._observable$.next(result.data);
      });

    this._search$.next();
  }

  get observable$() {
    return this._observable$.asObservable();
  }

  get loading$() {
    return this._loading$.asObservable();
  }

  set ListData(list: Array<T>) {
    this.arrayList = list;
    this._search$.next();
  }

  set searchTerm(searchTerm: string) {
    this._set({ searchTerm });
  }

  set sortColumn(sortColumn: SortColumn) {
    this._set({ sortColumn });
  }

  set sortDirection(sortDirection: SortDirection) {
    this._set({ sortDirection });
  }

  private _set(
    patch: Partial<{
      searchTerm: string;
      sortColumn: string | Function;
      sortDirection: string;
    }>
  ) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search() {
    const { searchTerm, sortColumn, sortDirection } = this._state;
    let data = this.arrayList;

    if (!searchTerm || !data) {
      if (typeof sortColumn === 'function') {
        return sortColumn(data, sortDirection).pipe(
          map((sortedList) => ({ data: sortedList }))
        );
      }

      const sortedList = sort(data, sortColumn, sortDirection);
      return of({ data: sortedList });
    }

    const result = this.filter(
      data as Array<{ [key: string]: any }>,
      searchTerm
    );

    if (typeof sortColumn === 'function') {
      const sortedList = sortColumn(result, sortDirection);
      return of({ data: sortedList });
    }

    const sortedList = sort(result, sortColumn as string, sortDirection);
    return of({ data: sortedList });
  }

  private filter(items: Array<{ [key: string]: any }>, term: string): any {
    const toCompare = term.toLowerCase();

    function checkInside(item: any, term: string) {
      for (let property in item) {
        if (item[property] === null || item[property] == undefined) {
          continue;
        }
        if (typeof item[property] === 'object') {
          if (checkInside(item[property], term)) {
            return true;
          }
        }
        if (item[property].toString().toLowerCase().includes(toCompare)) {
          return true;
        }
      }
      return false;
    }

    return items.filter(function (item) {
      return checkInside(item, term);
    });
  }
}

@Component({
  selector: 'app-team-donate-view',
  templateUrl: './team-donate-view.component.html',
  styleUrls: ['./team-donate-view.component.scss'],
  providers: [
    { provide: 'donateTeamInstance', useClass: DataFilterService },
    { provide: 'leftDonorInstance', useClass: DataFilterService },
    { provide: 'leftTeamInstance', useClass: DataFilterService },
    { provide: 'leftGroupInstance', useClass: DataFilterService },
  ],
  animations: [swingTrigger],
})
export class TeamDonateViewComponent implements OnInit, OnDestroy {
  //#region variable declarations
  public DonorNamePatterns = {
    L: { pattern: new RegExp(`[A-Za-z\u0590-\u05FF '-]`) },
  };
  cardMask = '(000)-000-000099999';
  isLoading = false;
  paymentSuccess = false;
  hasAllDonor = false;
  inAnimation = false;
  isDataProcessing = true;
  paymentError = 'Sorry for any inconvenience.';
  macAddress: string | null = '';
  teamId!: number;
  recaptchaToken: string = '';
  isCvvVisible: boolean = true;
  separatorLimit = '10000000';
  maskValue = '';
  CVVmaskvalue = '000';
  ExpMaskValue = '00/00';
  paymentCardType = '';
  totalDonation: number = 0;
  isDonorFundCard: boolean = true;
  isPledgerCard: boolean = true;
  minDate = moment(new Date());
  datepickerDrops = 'up';
  streetValue: string = '';
  teamHoverId: number | null = null;
  teamHoverDetails: LstDonateReasonObj | null = null;
  isBonusGoalVisibility: boolean = false;
  isDonarInfo: boolean = false;
  isCompleteClicked: boolean = false;
  questionOn: boolean = false;
  questionGuid: string = '';
  questionAnswer: string = '';
  donateAmountFormGroup!: FormGroup;
  teamSelectionFormGroup!: FormGroup;
  recurringFormGroup!: FormGroup;
  donorInfoFormGroup!: FormGroup;
  paymentFormGroup!: FormGroup;
  donatePageData!: GetDonatePageResponse;
  labelText: string = 'ADDNOTE';
  foundNoteTitle: any
  currency: string = 'USD';
  displayLanguage: string = 'English'
  remainingTimes: string | null = null;
  isDisplayCountdown = false;
  isDiner: boolean = true;
  isPhoneZerosValidation = false;
  isScheduleRecurringDonation = false;
  engLang: string = 'English'
  hebLang: string = 'Hebrew'
  public formatAmt$ = new Subject<string | null>();
  public teamFormatAmt$ = new Subject<teamAmtObj>();
  public recurringFormatAmt$ = new Subject<string>();
  public recurringFormatAmtPerPayment$ = new Subject<string>();

  lstDonateReason$!: Observable<Array<LstDonateReasonObj>>;
  lstDonorDonation$!: Observable<Array<LstDonorDonationObj>>;

  currencies: Array<GetCurrenciesObj> = [];
  currenci!: string;
  symbol!: string;

  leftTabPanelSetting$ = new BehaviorSubject<TabPanelSettingObj>({
    showDonorPanel: false,
    showTeamPanel: false,
    showGroupPanel: false,
    showHeader: true,
    expandTeamToShowDonors: false,
  });

  leftTeams$!: Observable<Array<LstDonateReasonObj>>;
  leftGroups$!: Observable<Array<LstGroupObj>>;

  frequencyListOptions: Array<LstSettingObj> = [];
  amountIncreaseContent: any;
  @ViewChild('rightTab', { static: false }) ngbTabset!: any;
  @ViewChild('thankYouModalContent', { static: false }) modalTemp!: TemplateRef<void>;
  @ViewChild(CdkVirtualScrollViewport, { static: false })
  viewport!: CdkVirtualScrollViewport;

  activeId = 'tab-selectbyid1';
  leftActiveId = 'tab-leftid1';
  isPaymentClickInProgress: boolean = false;
  teamPreselected: any;

  isToirem: boolean = false;
  sortDirection: SortDirection = 'desc';
  sortBy: any = '';
  donorPanelSortByOptions: SortOption[] = [
    {
      key: 'createdDateTime',
      value: 'Recent donations',
      sortByFunction: false,
    },
    { key: 'paid', value: 'Highest payment amount', sortByFunction: false },
  ];
  teamsPanelSortByOptions: SortOption[] = [
    { key: 'recent', value: 'Most recent', sortByFunction: true },
    { key: 'raised', value: 'Amount raised', sortByFunction: true },
    { key: 'donors', value: 'Amount of donors', sortByFunction: false },
    { key: 'goalReached', value: '% of goal reached', sortByFunction: false },
    { key: 'reasonName', value: 'Team Name (A-Z)', sortByFunction: false },
    { key: 'goal', value: 'Team Goal', sortByFunction: false },
  ];

  groupPanelSortByOptions: SortOption[] = [
    { key: 'recent', value: 'Most recent', sortByFunction: true },
    { key: 'raised', value: 'Amount raised', sortByFunction: true },
    { key: 'donors', value: 'Amount of donors', sortByFunction: false },
    { key: 'goalReached', value: '% of goal reached', sortByFunction: false },
    { key: 'reasonName', value: 'Team Name (A-Z)', sortByFunction: false },
    { key: 'goal', value: 'Team Goal', sortByFunction: false },
  ];

  sortOptionsToDisplay: SortOption[] = [];
  activeTabId: number = 1;
  defaultSortBy!: { donors: SortOption; teams: SortOption; group: SortOption };
  activeTabChanged: boolean = false;
  sortUpdate: string = '';
  noteTitleVal: string = 'Note Title'
  langTitleVal: string = 'NameDisplayLang'
  get DonateAmount() {
    return this.donateAmountFormGroup.get('amount');
  }

  get SelectedTeams() {
    return this.teamSelectionFormGroup.get('selectedTeams') as FormArray;
  }

  // for RecuringSection
  get RecurringAmount() {
    return this.recurringFormGroup.get('amount');
  }

  get RecurringCount() {
    return this.recurringFormGroup.get('count');
  }

  get RecurringAmountPerPayment() {
    return this.recurringFormGroup.get('amountPerPayment');
  }

  get RecurringFrequency() {
    return this.recurringFormGroup.get('frequency');
  }

  get RecurringDate() {
    return this.recurringFormGroup.get('transDate');
  }

  get isTeamTabVisible() {
    return (
      this.donatePageData &&
      this.donatePageData.lstDonateReason &&
      this.donatePageData.lstDonateReason.length !== 0
    );
  }
  // Donor Info

  get DonorInfoPhoneNumber() {
    return this.donorInfoFormGroup.get('PhoneNumber');
  }

  get DonorInfoEmail() {
    return this.donorInfoFormGroup.get('Email');
  }

  get DonorInfoFirstName() {
    return this.donorInfoFormGroup.get('FirstName');
  }

  get DonorInfoLastName() {
    return this.donorInfoFormGroup.get('LastName');
  }

  /*get DonorInfoFullNameJewish() {
    return this.donorInfoFormGroup.get("FullNameJewish");
  }*/

  get DonorInfoAccountID() {
    return this.donorInfoFormGroup.get('AccountID');
  }

  get DonorInfoStreetName() {
    return this.donorInfoFormGroup.get('StreetName');
  }

  get DonorInfoUnitNum() {
    return this.donorInfoFormGroup.get('UnitNum');
  }

  get DonorInfoCity() {
    return this.donorInfoFormGroup.get('City');
  }

  get DonorInfoState() {
    return this.donorInfoFormGroup.get('State');
  }

  get DonorInfoZip() {
    return this.donorInfoFormGroup.get('Zip');
  }

  get DonorInfoHouseNum() {
    return this.donorInfoFormGroup.get('HouseNum');
  }

  get DonorInfoDisplayName() {
    return this.donorInfoFormGroup.get('DisplayName');
  }

  get DonorInfoIsAnonymous() {
    return this.donorInfoFormGroup.get('isAnonymous');
  }

  // Payment Form group

  get PaymentCardNumber() {
    return this.paymentFormGroup.get('cardNumber');
  }

  get PaymentExp() {
    return this.paymentFormGroup.get('exp');
  }

  get PaymentCVV() {
    return this.paymentFormGroup.get('cvv');
  }

  get PaymentNote() {
    return this.paymentFormGroup.get('note');
  }

  get paymentMethodValue() {
    const cardValue = this.PaymentCardNumber?.value;
    return `${this.paymentCardType} ${cardValue.substring(
      cardValue.length - 4,
      cardValue.length
    )}`;
  }

  get SelectedTeamNameValues() {
    const v = this.SelectedTeams.getRawValue();
    if (v.length === 0) {
      return '';
    }
    let val = this.displayLanguage == 'English' ? v.map((x: { reasonName: string }) => x.reasonName).join(', ') : v.map((x: { reasonNameJewish: string }) => x.reasonNameJewish).join(', ')
    return val;
  }

  @ViewChild('ccNumberInputElm', { static: false })
  ccNumberInputElm!: ElementRef;
  @ViewChild('ccExpInputElm', { static: false }) ccExpInputElm!: ElementRef;
  @ViewChild('ccCVVInputElm', { static: false }) ccCVVInputElm!: ElementRef;
  isReasonExist: boolean = true;
  isSkipPersonalInfo: boolean = false;

  //#endregion
  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public commonMethodService: CommonMethodService,
    @Inject('donateTeamInstance')
    private dataFilterService: DataFilterService<LstDonateReasonObj>,
    @Inject('leftDonorInstance')
    private leftDonorFilterService: DataFilterService<LstDonorDonationObj>,
    @Inject('leftTeamInstance')
    private leftTeamFilterService: DataFilterService<LstDonateReasonObj>,
    @Inject('leftGroupInstance')
    private leftGroupFilterService: DataFilterService<LstGroupObj>,

    private donatePageAPI: DonatePageAPIService,
    private creditCardService: CreditCardService,
    private paymentService: PaymentService,
    private ngZone: NgZone,
    private translate: TranslateService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private commonAPIMethodService: CommonAPIMethodService,
    private renderer: Renderer2,

  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
    this.router.onSameUrlNavigation = 'reload';
  }

  ngOnInit() {
    this.isToirem = this.commonMethodService.isToirem();
    this.initForms();
    this.translate.use('en');
    this.formatAmt$.pipe(debounceTime(300)).subscribe((term: any) => {
      if (!term) {
        this.DonateAmount?.setValue(null, { emitEvent: true });
        return;
      }

      if (term !== '') {
        const toFix = this.getNumberWithFormate(term);
        this.DonateAmount?.setValue(toFix, { emitEvent: true });
        if (
          this.teamPreselected &&
          this.haveSelected(this.teamPreselected) &&
          this.SelectedTeams.length < 2
        ) {
          this.SelectedTeams.at(0).patchValue({ amount: toFix });
        }
        if (
          this.teamPreselected &&
          this.haveSelected(this.teamPreselected) &&
          this.SelectedTeams.length >= 2
        ) {
        }
      }
    });

    this.teamFormatAmt$
      .pipe(debounceTime(300))
      .subscribe(({ value, index }) => {
        if (value !== '') {
          const toFix = this.getNumberWithFormate(value);
          this.SelectedTeams.at(index).patchValue({ amount: toFix });
        }
      });

    this.recurringFormatAmt$.pipe(debounceTime(300)).subscribe((term: any) => {
      if (!term) {
        this.RecurringAmount?.setValue(null, { emitEvent: true });
        this.RecurringAmountPerPayment?.setValue(null, {
          emitEvent: true,
        });
        return;
      }

      if (term !== '') {
        const toFix = this.getNumberWithFormate(term);
        const count = +this.RecurringCount?.value;
        const perPayment = (Number(toFix) / count).toFixed(2);

        this.RecurringAmount?.setValue(toFix, { emitEvent: true });
        this.RecurringAmountPerPayment?.setValue(perPayment, {
          emitEvent: true,
        });
      }
    });
    this.recurringFormatAmtPerPayment$
      .pipe(debounceTime(300))
      .subscribe((term: any) => {
        if (!term) {
          this.RecurringAmount?.setValue(null, { emitEvent: true });
          this.RecurringAmountPerPayment?.setValue(null, {
            emitEvent: true,
          });
          return;
        }

        if (term !== '') {
          const perPayment = this.getNumberWithFormate(term);
          const count = +this.RecurringCount?.value;
          const toFix = (Number(perPayment) * count).toFixed(2);
          this.RecurringAmount?.setValue(toFix, { emitEvent: true });
          this.RecurringAmountPerPayment?.setValue(perPayment, {
            emitEvent: true,
          });
        }
      });

    this.activatedRoute.paramMap.subscribe((param) => {
      const tenantId = param.get('teamId');

      if (tenantId) {
        this.teamId = +tenantId;
        this.leftActiveId = 'tab-leftid2';
      }

      if (this.commonMethodService.isToirem()) {
        if (this.teamId !== 0) {
          this.macAddress = this.commonMethodService.getMacAddress(this.teamId);
          return;
        }
        this.macAddress = this.commonMethodService.getMacAddress(null);
      } else {
        this.macAddress = param.get('macAddress');
      }
    });

    this.activatedRoute.data.subscribe(({ donateData }) => {
      this.isDataProcessing = true;
      this.dataProcess(donateData);
      const eventGuId = (donateData as GetDonatePageResponse).lstSetting.find(
        (o) => o.name === 'EventGUID'
      );

      const value = eventGuId && eventGuId.value ? eventGuId.value : null;

      this.getCurrencies(value);
    });

    this.lstDonateReason$ = this.dataFilterService.observable$;
    this.lstDonorDonation$ = this.leftDonorFilterService.observable$;
    this.leftTeams$ = this.leftTeamFilterService.observable$;
    this.leftGroups$ = this.leftGroupFilterService.observable$;

    // this.leftGroups$ = this.leftGroups$.pipe(
    //   map((data: Array<LstDonateReasonObj>) =>
    //     data.filter(
    //       (item) =>
    //         item.parentId === this.lstGrpData ||
    //         item.reasonId === this.lstGrpData
    //     )
    //   )
    // );
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.isSkipPersonalInfo = false;
      if (params && params.SkipPersonalInfo == 'true') {
        this.isSkipPersonalInfo = true;
        this.donorInfoRemoveValidation();
      }
    });
    this.setDefaultSortValuesForDonor();

    this.leftTabPanelSetting$.subscribe((settings) => {
      if (!settings?.showDonorPanel && settings?.showTeamPanel) {
        this.leftActiveId = 'tab-leftid2';
        this.setSorByOptions(2);
      }
      else if (!settings?.showDonorPanel && !settings?.showTeamPanel && settings?.showGroupPanel) {
        this.leftActiveId = 'tab-leftid3';
        this.setSorByOptions(3);
      }
    });
  }

  setDefaultSortValuesForDonor() {
    this.sortOptionsToDisplay = this.donorPanelSortByOptions;
    this.defaultSortBy = {
      donors: this.donorPanelSortByOptions[0],
      teams: (this.sortBy = this.teamsPanelSortByOptions.find(
        (option) => option.key === 'raised'
      )) as SortOption,
      group: this.groupPanelSortByOptions[0],
    };
    this.sortBy = this.defaultSortBy?.donors;
    this.leftDonorFilterService.sortColumn = this.sortBy.key;
  }

  ngAfterViewInit() {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }

  ngOnDestroy(): void {
    this.commonMethodService.error404 = ''
    // this.formatAmt$.unsubscribe();
    // this.recurringFormatAmt$.unsubscribe();
    // this.recurringFormatAmtPerPayment$.unsubscribe();
  }

  private getNumberWithFormate(inputValue: string) {
    const term = Number(inputValue.replace(/,/g, ''));
    return isNaN(term) ? '0.00' : term.toFixed(2);
  }

  private initForms() {
    this.donateAmountFormGroup = this.fb.group({
      amount: this.fb.control(
        null,
        Validators.compose([Validators.required, Validators.min(1)])
      ),
    });

    this.teamSelectionFormGroup = this.fb.group({
      selectedTeams: this.fb.array([]),
    });

    this.recurringFormGroup = this.fb.group({
      amount: this.fb.control(
        null,
        Validators.compose([Validators.required, Validators.min(1)])
      ),
      count: this.fb.control(
        12,
        Validators.compose([Validators.required, Validators.min(1)])
      ),
      amountPerPayment: this.fb.control(
        null,
        Validators.compose([Validators.required, Validators.min(0)])
      ),
      frequency: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),

      transDate: this.fb.control(
        {
          startDate: moment(new Date()),
          endDate: moment(new Date()),
        },
        Validators.compose([Validators.required])
      ),
    });

    this.donorInfoFormGroup = this.fb.group({
      PhoneNumber: this.fb.control(
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('(?!0000000000)[0-9][0-9]{9,19}$'),
        ])
      ),
      Email: this.fb.control(
        null,
        Validators.compose([Validators.required, Validators.email])
      ),

      FirstName: this.fb.control('', Validators.compose([Validators.required])),
      LastName: this.fb.control('', Validators.compose([Validators.required])),
      DisplayName: this.fb.control(null),
      AccountID: this.fb.control(null),
      StreetName: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),
      UnitNum: this.fb.control(null),
      HouseNum: this.fb.control(null),
      City: this.fb.control(null, Validators.compose([Validators.required])),
      State: this.fb.control(null, Validators.compose([Validators.required])),
      Zip: this.fb.control(null, Validators.compose([Validators.required])),
      isAnonymous: this.fb.control(false),
      // isVisitAPI: this.fb.control(true, Validators.compose([Validators.requiredTrue])),
    });

    this.paymentFormGroup = this.fb.group({
      cardNumber: this.fb.control(
        null,
        Validators.compose([
          Validators.required,
          (control: AbstractControl) => {
            if (control.pristine) {
              return null;
            }
            const condition = this.creditCardService.luhnCheck(
              control.value || ''
            );
            return condition ? null : { luhnError: true };
          },
        ])
      ),
      exp: this.fb.control(
        null,
        Validators.compose([
          Validators.required,
          (control: AbstractControl) => {
            if (control.pristine) {
              return null;
            }

            let expiryDate = control.value;

            if (!expiryDate || expiryDate.length <= 3) {
              return { expInvalid: true };
            }

            let currentMonth = new Date().getMonth() + 1;
            let currentYear = new Date().getFullYear().toString();
            let intCurYear = Number(currentYear.substring(2, 5));
            let month = expiryDate.substring(0, 2);
            let year = expiryDate.substring(2, 4);

            if (Number(month) > 12) {
              return { expInvalid: true };
            }

            if (Number(year) < intCurYear) {
              return { expInvalid: true };
            }

            if (Number(year) == intCurYear && Number(month) < currentMonth) {
              return { expInvalid: true };
            }

            return null;
          },
        ])
      ),
      cvv: this.fb.control(null, Validators.compose([Validators.required])),
      note: this.fb.control(null),
    });

    this.RecurringCount?.valueChanges.subscribe((val) => {
      const toFix = this.getNumberWithFormate(this.RecurringAmount?.value);
      const count = +val;
      const perPayment = (Number(toFix) / count).toFixed(2);

      this.recurringFormGroup.patchValue({
        amount: toFix,
        amountPerPayment: perPayment,
      });
    });

    this.DonorInfoIsAnonymous?.valueChanges.subscribe((val) => {
      if (val) {
        this.DonorInfoDisplayName?.setValue('Anonymous');
        this.DonorInfoDisplayName?.disable();
        return;
      }

      this.DonorInfoDisplayName?.setValue(
        `${this.DonorInfoFirstName?.value} ${this.DonorInfoLastName?.value}`
      );
      this.DonorInfoDisplayName?.enable();
    });

    this.PaymentCardNumber?.valueChanges.subscribe((val) => {
      if (val && val.length >= 2) {
        let twoDigit = val.substring(0, 2);
        let threedigit = val.substring(0, 3);
        if (twoDigit == '34' || twoDigit == '37') {
          this.maskValue = this.creditCardService.getAmexMask();
          this.CVVmaskvalue = '0000';
          this.paymentCardType = 'Amex';
          this.changeDetectorRef.markForCheck();
        } else {
          if (
            twoDigit == '36' ||
            twoDigit == '38' ||
            twoDigit == '39' ||
            threedigit == '300' ||
            threedigit == '301' ||
            threedigit == '302' ||
            threedigit == '303' ||
            threedigit == '304' ||
            threedigit == '305'
          ) {
            this.paymentCardType = 'Diner';

            if (this.PaymentCardNumber?.value.length == 14) {
              this.maskValue = this.creditCardService.getDinerMask(true);
            } else {
              this.maskValue = this.creditCardService.getDinerMask();
            }
          } else {
            this.maskValue = this.creditCardService.getDefaultMask();
          }
          this.CVVmaskvalue = '0000';
          this.changeDetectorRef.markForCheck();
        }

        let firstDigit = val.substring(0, 1);
        if (firstDigit == '4') {
          this.paymentCardType = 'Visa';
        } else if (firstDigit == '5') {
          this.paymentCardType = 'Master';
        } else if (firstDigit == '6') {
        }

        let firstFourDigit = val.substring(0, 4);
        if (firstFourDigit === '8628') {
          this.paymentCardType = 'Matbia';
          this.CVVmaskvalue = '';
        }
        this.isCvvHideShow(val);
        this.isDonarsFundPledgerShowHideIcon(val);
        this.changeDetectorRef.detectChanges();
      }
    });

    this.maskValue = this.creditCardService.getDefaultMask();
  }
  ChangeCreditMask() {
    if ((this.paymentCardType = 'Diner')) {
      if (this.PaymentCardNumber?.value?.length == 14)
        this.maskValue = this.creditCardService.getDinerMask(true);
      else this.maskValue = this.creditCardService.getDinerMask();
    }
  }

  getHomeRoute() {
    if (this.commonMethodService.isToirem()) {
      return 'https://toirem.org/';
    }
    return '/';
  }

  getDonateRoute() {
    if (this.commonMethodService.isToirem()) {
      return 'https://toirem.org/contact/';
    }
    return `/#contact`;
  }

  getAuthRoute() {
    return [`/`];
  }

  goTocampaignDonate() {
    return [`/${this.macAddress}`];
  }

  triggerAnimation() {
    if (this.inAnimation) {
      return;
    }

    this.inAnimation = true;
    setTimeout(() => {
      this.inAnimation = false;
    }, 1000);
  }

  needToAnimate(ctrl: any) {
    if (ctrl.touched && ctrl.invalid && this.inAnimation) {
      return true;
    }

    return false;
  }

  goToTeamsInfoTab() {
    if (this.donateAmountFormGroup.invalid) {
      this.donateAmountFormGroup.markAllAsTouched();
      this.triggerAnimation();
      return;
    }

    if (this.isTeamTabVisible) {
      this.ngbTabset.select('tab-selectbyid2');
      return;
    }

    this.ngbTabset.select('tab-selectbyid3');
  }

  goToDonorInfoTab(amountIncreaseContent: any) {
    if (this.teamSelectionFormGroup.invalid) {
      this.teamSelectionFormGroup.markAllAsTouched();
      this.triggerAnimation();
      return;
    }

    // if (this.SelectedTeams.length === 0) {
    //   return;
    // }

    if (this.SelectedTeams.length > 1) {
      const teams: Array<{ amount: string }> = this.SelectedTeams.getRawValue();

      const totalDonation = teams.reduce((prev, current) => {
        return prev + +current.amount;
      }, 0);
      this.totalDonation = this.convertStringToNumber(totalDonation.toString());
    }

    this.amountIncreaseContent = amountIncreaseContent;
    if (
      this.SelectedTeams.length > 1 &&
      this.totalDonation != this.DonateAmount?.value
    ) {
      this.donationAmountIncreasedPopup(
        'tab-selectbyid3',
        this.amountIncreaseContent
      );
      return;
    }

    this.ngbTabset.select('tab-selectbyid3');
  }

  goToPaymentInfoTab() {
    if (this.donorInfoFormGroup.invalid) {
      this.donorInfoFormGroup.markAllAsTouched();
      this.triggerAnimation();
      return;
    }
    if (!this.DonorInfoDisplayName?.value) {
      this.DonorInfoDisplayName?.setValue(
        `${this.DonorInfoFirstName?.value} ${this.DonorInfoLastName?.value}`
      );
    }
    if (
      this.SelectedTeams.length > 1 &&
      this.totalDonation != this.DonateAmount?.value
    ) {
      this.donationAmountIncreasedPopup(
        'tab-selectbyid4',
        this.amountIncreaseContent
      );
      return;
    }

    this.ngbTabset.select('tab-selectbyid4');
  }

  openDetails(event: any, content: any) {
    event.preventDefault();

    this.commonMethodService.openPopup(content, {
      size: 'sm',
      backdrop: 'static',
      keyboard: true,
      windowClass: 'drag_popup readmore-modal',
    });
  }

  getCurrencies(value: string | null) {
    this.commonAPIMethodService.getCurrencies(value || '').subscribe((res) => {
      this.currencies = res;
      this.currenci = 'USD';
      this.updateSymbol();
    });
  }

  updateSymbol() {
    const selectedCurrency = this.currencies.find(
      (c) => c.currencyName === this.currenci
    );
    if (selectedCurrency && selectedCurrency.currencyName) {
      this.symbol = this.getCurrencySymbol(selectedCurrency.currencyName);
      this.currency = selectedCurrency.currencyName;
    } else {
      this.symbol = '';
    }
  }

  getSelectedCurrency() {
    const selectedCurrency = this.currencies.find(
      (c) => c.currencyName === this.currenci
    );
    return selectedCurrency?.currencyName;
  }

  getCurrencySymbol(currencyName: string): string {
    switch (currencyName) {
      case 'USD':
        return '$';
      case 'CAD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'ILS':
        return '₪';
      default:
        return '';
    }
  }
  //for show currency and sybmol code ended

  openScheduleDetails(event: any, content: any) {
    event.preventDefault();

    if (this.DonateAmount?.value) {
      this.recurringFormatAmt$.next(this.DonateAmount.value);
    }

    this.commonMethodService.openPopup(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: true,
      windowClass: 'drag_popup schedule-recurring-modal',
    });
  }

  private dataProcess(res: GetDonatePageResponse) {
    res.fundRaisedPercent =
      res.fundRaisedPercent > 100 ? 100 : res.fundRaisedPercent;
    if (
      res.campaignBonusGoal > 0 &&
      res.totalFundRaised &&
      res.campaignGoal < res.totalFundRaised
    ) {
      let bonusDiff = res.campaignBonusGoal - res.campaignGoal;
      let difference = res.totalFundRaised - res.campaignGoal;
      res.bonusGoalPercentage = (difference / bonusDiff) * 100;
    }

    if (res.totalFundRaised >= res.campaignGoal && res.campaignBonusGoal > 0) {
      this.isBonusGoalVisibility = true;
    }

    this.donatePageData = res;
    this.foundNoteTitle = this.donatePageData.lstSetting?.find(item => item.name === this.noteTitleVal);
    this.labelText = this.foundNoteTitle?.value ? this.foundNoteTitle?.value : 'ADDNOTE';
    const lang = this.donatePageData.lstSetting?.find(item => item.name === this.langTitleVal)
    this.displayLanguage = (lang?.value === this.engLang || lang?.value === null) ? this.engLang : this.hebLang;
    this.displayCountdown();

    if (res.lstDonateReason?.length > 0) {
      res.lstDonateReason.forEach((reason) => {
        let goalReached = ((reason.raised * 100) / reason.goal)?.toFixed(2);
        reason['goalReached'] = goalReached != 'NaN' ? +goalReached : 100;
      });
    }

    this.dataFilterService.ListData = res.lstDonateReason || [];
    this.leftDonorFilterService.ListData = res.lstDonorDonation || [];
    this.leftTeamFilterService.ListData = res.lstDonateReason || [];
    this.leftGroupFilterService.ListData = res.lstGroup || [];

    if (this.teamId) {
      this.isReasonExist = res.lstDonateReason.some(
        (item) => item.number == this.teamId || item.reasonId == this.teamId
      );
      this.leftTeamFilterService.ListData = res.lstDonateReason.filter(
        (x) => x.number == this.teamId
      );
    }
    if (
      this.teamId &&
      res.lstDonateReason &&
      res.lstDonateReason.length !== 0
    ) {
      const item = res.lstDonateReason.find((o) => o.number === this.teamId);
      if (item) {
        this.teamPreselected = item;
        this.onSelectTeam(item);
      }
    }

    const showHeader = this.donatePageData.lstSetting.find(
      (o) => o.name === 'Header'
    );

    const showDonorPanel = this.donatePageData.lstSetting.find(
      (o) => o.name === 'ShowDonorPanel'
    );

    const showTeamPanel = this.donatePageData.lstSetting.find(
      (o) => o.name === 'ShowTeamPanel'
    );

    const showGroupPanel = this.donatePageData.lstSetting.find(
      (o) => o.name === 'ShowGroupPanel'
    );

    const expandTeamToShowDonor = this.donatePageData.lstSetting.find(
      (o) => o.name === 'ExpandTeamToShowDonors'
    );

    const eventCurrency = this.donatePageData.lstSetting.find(
      (o) => o.name === 'EventCurrency'
    );

    if (eventCurrency && eventCurrency.value) {
      this.currency = eventCurrency.value;
    }
    
    this.leftTabPanelSetting$.next({
      showDonorPanel:
        showDonorPanel &&
          showDonorPanel.value &&
          showDonorPanel.value.toLowerCase() === 'true'
          ? true
          : false,
      showTeamPanel:
        showTeamPanel &&
          showTeamPanel.value &&
          showTeamPanel.value.toLowerCase() === 'true'
          ? true
          : false,
      showGroupPanel:
        showGroupPanel &&
          showGroupPanel.value &&
          showGroupPanel.value.toLowerCase() === 'true'
          ? true
          : false,
      showHeader:
        showHeader &&
          showHeader.value &&
          showHeader.value.toLowerCase() === 'true'
          ? true
          : false,

      expandTeamToShowDonors:
        expandTeamToShowDonor &&
          expandTeamToShowDonor.value &&
          expandTeamToShowDonor.value.toLowerCase() === 'true'
          ? true
          : false,
    });

    this.frequencyListOptions = this.donatePageData.lstSetting.filter(
      (o) => o.name === 'Frequency'
    );

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.isDataProcessing = false;
        });
      }, 500);
    });
  }

  private displayCountdown() {
    if (
      this.donatePageData &&
      this.donatePageData.campaignEndTime &&
      this.donatePageData.campaignEndTime !== '0001-01-01T00:00:00'
    ) {
      this.isDisplayCountdown = moment(
        this.donatePageData.campaignEndTime
      ).isSameOrAfter(moment());

      if (!this.isDisplayCountdown) {
        return;
      }

      this.ngZone.runOutsideAngular(() => {
        setInterval(() => {
          this.ngZone.run(() => {
            var countDownDate = new Date(
              this.donatePageData.campaignEndTime
            ).getTime();

            // Get today's date and time
            let now = new Date().getTime();

            // Find the distance between now and the count down date
            let distance = countDownDate - now;

            // Time calculations for days, hours, minutes and seconds
            let days = Math.floor(distance / (1000 * 60 * 60 * 24));
            let hours = Math.floor(
              (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            let minutes = Math.floor(
              (distance % (1000 * 60 * 60)) / (1000 * 60)
            );
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (days > 0) {
              this.remainingTimes =
                days + ' Days ' + hours + ':' + minutes + ':' + seconds;
            } else {
              this.remainingTimes = hours + ':' + minutes + ':' + seconds;
            }
          });
        }, 1000);
      });
    }
  }

  onAmountAdd(event: any) {
    this.formatAmt$.next((event.target as HTMLInputElement).value);
  }

  onTeamAmountAdd(event: any, index: number) {
    this.teamFormatAmt$.next({
      value: (event.target as HTMLInputElement).value,
      index,
    });
  }

  onRecurringAmountAdd(event: any) {
    this.recurringFormatAmt$.next((event.target as HTMLInputElement).value);
  }

  onRecurringAmountPerPaymentAdd(event: any) {
    this.recurringFormatAmtPerPayment$.next(
      (event.target as HTMLInputElement).value
    );
  }

  private reInitAmounts() {
    this.formatAmt$.next(null);
    this.recurringFormGroup.patchValue(
      {
        amount: null,
        amountPerPayment: null,
        frequency: null,
        transDate: {
          startDate: moment(new Date()),
          endDate: moment(new Date()),
        },
      },
      { emitEvent: false }
    );
  }

  onCancelRecurring(modal: any) {
    this.reInitAmounts();
    this.isScheduleRecurringDonation = false;
    modal.close();
  }

  onSaveRecurring(modal: any, scheduleIncreaseContent: any) {
    if (this.recurringFormGroup.invalid) {
      this.recurringFormGroup.markAllAsTouched();
      this.triggerAnimation();
      return;
    }
    this.isScheduleRecurringDonation = true;
    if (
      Number(this.RecurringAmount?.value) >
      Number(this.DonateAmount?.value || '0')
    ) {
      const modalRef = this.commonMethodService.openPopup(
        scheduleIncreaseContent,
        {
          size: 'md',
          backdrop: 'static',
          keyboard: true,
          windowClass: 'drag_popup schedule-amount-increased-modal',
        }
      );

      modalRef.result
        .then(() => {
          this.formatAmt$.next(this.RecurringAmount?.value);
        })
        .catch(() => {
          this.reInitAmounts();
        });

      modal.close();
      return;
    }

    this.formatAmt$.next(this.RecurringAmount?.value);
    modal.close();
  }

  searchInLstDonateReason(event: any) {
    this.dataFilterService.searchTerm = (
      event.target as HTMLInputElement
    ).value;
  }

  searchInLstDonorDonation(event: any) {
    this.leftDonorFilterService.searchTerm = (
      event.target as HTMLInputElement
    ).value;
  }

  searchInLeftTeams(event: any) {
    this.leftTeamFilterService.searchTerm = (
      event.target as HTMLInputElement
    ).value;
  }

  searchInLeftGroup(event: any) {
    this.leftGroupFilterService.searchTerm = (
      event.target as HTMLInputElement
    ).value;
  }

  /**
   ** filter out the lstDonorDonation list with reasonIds.
   ** sort them by 'paid' and assign to sortedDonationByPaidAmt
   ** store all the unique Ids from sortedDonationByPaidAmt and push the reason with that id in sortedArray
   ** keep only unique values in sortedArray
   */
  onSortLstDonorReasons() {
    this.leftTeamFilterService.sortColumn = (
      data: any[],
      direction: string
    ) => {
      //#region - Sorting for Most Recent in Teams Panel
      if (this.sortBy.key == 'recent')
        return direction == 'asc' ? of([...data].reverse()) : of([...data]);
      //#endregion

      //#region - Sorting for Amount Raised in Teams Panel
      return this.lstDonorDonation$.pipe(
        // Use switchMap to handle the observable stream
        switchMap((donations) => {
          // Filter and sort donations with a reasonId
          let donationsWithReasons = donations.filter(
            (donation) => donation.reasonId
          );

          let sortedDonationByPaidAmt = donationsWithReasons.sort(
            (a: LstDonorDonationObj, b: LstDonorDonationObj) => b.paid - a.paid
          );

          // Create a Set to track unique reasonIds
          let uniqueReasonIds = new Set<number>();
          let sortedArray: any[] = [];

          // Use a single loop to gather unique reasonIds and build the sorted array
          sortedDonationByPaidAmt.forEach((donate) => {
            if (!uniqueReasonIds.has(donate.reasonId)) {
              uniqueReasonIds.add(donate.reasonId);
              let reason = data.find(
                (item) => item.reasonId == donate.reasonId
              );
              if (reason) sortedArray.push(reason);
            }
          });

          // Combine and deduplicate the sortedArray and the original data
          sortedArray = _.uniqBy([...sortedArray, ...data], 'reasonId');

          if (direction == 'asc') sortedArray = sortedArray.reverse();
          // Return the sortedArray wrapped in an observable
          return of(sortedArray);
        })
      );
      //#endregion
    };
  }

  onSortInLeftTeams(event: any) {
    this.leftTeamFilterService.sortColumn = '';
    this.leftTeamFilterService.sortDirection = 'desc';
  }

  onSortInLeftGroup(event: any) {
    this.leftGroupFilterService.sortColumn = '';
    this.leftGroupFilterService.sortDirection = 'desc';
  }

  donorHaveTeam(teams: Array<LstDonateReasonObj>, item: LstDonorDonationObj) {
    const hasTeams = teams.find((o) => o.reasonId === item.reasonId);
    return hasTeams ? true : false;
  }

  onHover(teamHoverPopup: any, item: LstDonorDonationObj) {
    this.teamHoverId = item.reasonId || null;
    this.leftTeams$.subscribe((val) => {
      const findVal = val.find((o) => o.reasonId === this.teamHoverId);
      if (findVal) {
        this.teamHoverDetails = findVal;
        teamHoverPopup.open();
      }
    });
  }

  onHoverOff(teamHoverPopup: any) {
    this.teamHoverId = null;
    this.teamHoverDetails = null;
    teamHoverPopup.close();
  }

  onSelectTeam(item: LstDonateReasonObj) {
    if (this.haveSelected(item)) {
      const v: Array<{ number: number }> = this.SelectedTeams.getRawValue();
      const index = v.findIndex((o) => o.number === item.number);
      this.SelectedTeams.removeAt(index);
      return;
    }
    if (this.isScheduleRecurringDonation) {
      this.SelectedTeams.clear();
    }

    let amountValue = null;

    if (this.SelectedTeams.length === 0) {
      amountValue = this.DonateAmount?.value;
    }

    this.SelectedTeams.push(
      this.fb.group({
        number: this.fb.control(item.number),
        reasonId: this.fb.control(
          item.reasonId,
          Validators.compose([Validators.required])
        ),
        reasonName: this.fb.control(
          item.reasonName
        ),
        reasonNameJewish: this.fb.control(item?.reasonNameJewish),
        amount: this.fb.control(
          amountValue,
          Validators.compose([Validators.required])
        ),
      })
    );
  }

  haveSelected(item: LstDonateReasonObj) {
    const v: Array<{ number: number }> = this.SelectedTeams.getRawValue();
    if (v.find((o) => o.number === item.number)) {
      return true;
    }

    return false;
  }

  removeTeam(index: number) {
    this.SelectedTeams.removeAt(index);
  }

  onAddressChange(data: any) {
    let streetAddress = data.streetName;
    this.streetValue = data.streetName;
    if (data.streetNumber && data.streetName) {
      streetAddress = `${data.streetNumber} ${data.streetName}`;
    }

    this.donorInfoFormGroup.patchValue({
      HouseNum: data.streetNumber,
      StreetName: streetAddress,
      City: data.locality.long || data.locality.short || data.sublocality,
      State: data.state.short,
      Zip: data.postalCode,
    });
  }

  getDonorInfoByPhone() {
    if (this.DonorInfoPhoneNumber?.invalid) {
      this.donorInfoFormGroup.markAllAsTouched();
      this.triggerAnimation();
      return;
    }

    this.isLoading = true;
    this.donatePageAPI
      .getDonorLookupByPhone(
        this.macAddress ? this.macAddress : '',
        this.DonorInfoPhoneNumber?.value
      )
      .subscribe(
        (res) => {
          this.isLoading = false;
          const parseResponse = (res: any) => {
            try {
              return JSON.parse(res);
            } catch (error) {
              return [];
            }
          };

          if (res) {
            const resData: Array<DonorByPhoneObj> = parseResponse(res);

            if (resData && resData.length !== 0) {
              this.donorInfoFormGroup.patchValue({
                DisplayName: this.DonorInfoDisplayName?.enabled
                  ? resData[0].FullName.toLowerCase().includes('new account')
                    ? ''
                    : resData[0].FullNameJewish || resData[0].FullName
                  : 'Anonymous',
                FirstName: resData[0].FirstName,
                LastName: resData[0].LastName,
                AccountID: resData[0].AccountID,
                StreetName: resData[0].HouseNum + ' ' + resData[0].StreetName,
                UnitNum: resData[0].UnitNum,
                City: resData[0].City,
                State: resData[0].State,
                Zip: resData[0].Zip,
                HouseNum: resData[0].HouseNum,
              });

              this.donorInfoFormGroup.updateValueAndValidity();
              this.streetValue = resData[0].StreetName;
            }
          }
        },
        (err) => {
          this.isLoading = false;
        }
      );
  }

  paymentTabNext(event: any, name: string) {
    var key = event.keyCode || event.charCode;
    const val = (event.target as HTMLInputElement).value;
    this.PaymentCardNumber?.updateValueAndValidity();
    this.changeDetectorRef.detectChanges();
    if (key !== 37) {
      if (name === 'card') {
        const d = val.replace('_', '');
        if (
          this.isDiner &&
          this.PaymentCardNumber?.valid &&
          name === 'card' &&
          this.maskValue.length
        ) {
          this.PaymentCardNumber?.updateValueAndValidity();
          this.changeDetectorRef.detectChanges();
          this.ccExpInputElm.nativeElement.focus();
          return;
        }
        if (name === 'card' && d.length >= this.maskValue.length) {
          this.PaymentCardNumber?.updateValueAndValidity();
          this.changeDetectorRef.detectChanges();
          this.ccExpInputElm.nativeElement.focus();
          return;
        }
      }

      if (
        name === 'exp' &&
        val.length === this.ExpMaskValue.length &&
        this.isCvvVisible
      ) {
        this.ccCVVInputElm.nativeElement.focus();
        return;
      }
    }
  }

  private getCampaignId() {
    const defaultCampaignId = this.donatePageData.lstSetting.find(
      (o) => o.name === 'DefaultCampaignID'
    );

    const campaignId = this.donatePageData.lstSetting.find(
      (o) => o.name === 'CampaignID'
    );

    if (
      defaultCampaignId &&
      defaultCampaignId.value &&
      Number(defaultCampaignId.value) > 0
    ) {
      return defaultCampaignId.value;
    }

    return campaignId && campaignId.settingId ? campaignId.settingId : '';
  }

  getQuestionSetting() {
    const QuestionSetting = this.donatePageData.lstSetting.find(
      (o) => o.name === 'DonatePageQuestionVerification'
    );
    this.questionOn =
      (QuestionSetting && QuestionSetting.value == 'true') ||
        (QuestionSetting && QuestionSetting.value == 'True')
        ? true
        : false;
    this.getQuestion();
  }

  getQuestion() {
    this.donatePageAPI.getSecurityQuestion().subscribe(
      (res) => {
        Swal.fire({
          title: 'Please verify your identity',
          icon: 'warning',
          input: 'number',
          html:
            '<span> ' +
            res.questionHebrew +
            '<br> ' +
            res.questionYiddish +
            ' </span> <br> To continue, please enter the question response',
          confirmButtonText: 'Confirm',
          confirmButtonColor: '#7b5bc4',
          customClass: { confirmButton: 'modal-are-you-sure' },
        }).then((result) => {
          if (result.value) {
            this.questionAnswer = result.value;
            this.questionGuid = res.questionGUID;
            this.isPaymentClickInProgress = false;
            this.isCompleteClicked = false;
            this.onPaymentClick(this.modalTemp);
          }
        });
      },
      (err) => {
        this.isLoading = false;
      }
    );
  }

  onPaymentClick(thankYouModalContent: any) {
    if (this.isPaymentClickInProgress) {
      return;
    }

    this.updateCVVValidation();
    this.isCompleteClicked = false;
    if (this.paymentFormGroup.invalid) {
      this.paymentFormGroup.markAllAsTouched();
      this.triggerAnimation();
      return;
    }

    if (this.donateAmountFormGroup.invalid) {
      this.ngbTabset.select('tab-selectbyid1');
      return;
    }

    if (this.isTeamTabVisible) {
      if (
        this.teamSelectionFormGroup.invalid &&
        this.SelectedTeams.length === 0
      ) {
        this.ngbTabset.select('tab-selectbyid2');
        return;
      }
    }

    if (this.donorInfoFormGroup.invalid) {
      this.ngbTabset.select('tab-selectbyid3');
      return;
    }
    this.isCompleteClicked = true;
    this.isPaymentClickInProgress = true;
    let paymentRecurringModel = {};

    let amountValue = Number(this.DonateAmount?.value);

    if (this.recurringFormGroup.valid) {
      const recurrenceCountValue = +this.RecurringCount?.value - 1;

      paymentRecurringModel = {
        RecurrenceAmount: Number(this.RecurringAmountPerPayment?.value),
        RecurrenceCount: recurrenceCountValue > 0 ? recurrenceCountValue : 1,
        ScheduleDateTime: this.RecurringDate?.value.startDate,
        RecurrenceFrequency: this.RecurringFrequency?.value,
      };
      amountValue = Number(this.RecurringAmountPerPayment?.value);
    }

    const paymentCampaignId = this.getCampaignId();

    const defaultReasonId = this.donatePageData.lstSetting.find(
      (o) => o.name === 'DefaultReasonID'
    );
    let teams = this.SelectedTeams.getRawValue();
    let singleSelectedReasonID = '';
    let paymentDetails: Array<any> = [];
    let paymentReasonId = '';

    if (teams.length === 1) {
      singleSelectedReasonID = teams[0].reasonId;
    }
    if (teams.length === 1 && singleSelectedReasonID) {
      paymentReasonId = singleSelectedReasonID;
    } else if (teams.length == 0) {
      paymentReasonId = Number(defaultReasonId?.value).toString();
    } else if (teams.length > 1) {
      paymentDetails = teams.map((o) => {
        return {
          CampaignId: paymentCampaignId,
          IsValidRequest: true,
          Error: '',
          GatewayTransactionId: 0,
          ReasonId: o.reasonId,
          Amount: Number(o.amount),
        };
      });
    }

    let abc = this.recaptchaV3Service.execute('Payment').subscribe(
      (token) => {
        if (token) {          
          this.recaptchaToken = token;
          const payload = {
            AccountId: this.DonorInfoAccountID?.value
              ? this.DonorInfoAccountID.value
              : '',
            Amount: amountValue,
            MacAddress: this.macAddress,
            PaymentReasonId: paymentReasonId,
            //PaymentDate: moment().local().format('YYYY-MM-DDTHH:MM:SS.SSSZ'),//Let BE Handle PaymentDate from event timezone and UTC date
            CampaignId: paymentCampaignId,
            PaymentMethodId: 4,
            EntryTypeId: 1,
            Email: this.DonorInfoEmail?.value,
            CardHolderName: this.DonorInfoDisplayName?.value,
            // Name: this.DonorInfoFullNameJewish.value,
            FirstName: this.DonorInfoFirstName?.value,
            LastName: this.DonorInfoLastName?.value,
            Address: '',
            Zip: null,
            Phone: this.DonorInfoPhoneNumber?.value,
            currency: this.getSelectedCurrency(),
            UniqueTransactionId: Guid.create().toString(),
            HouseNum: this.DonorInfoHouseNum?.value,
            Street: this.streetValue,
            Unit: this.DonorInfoUnitNum?.value,
            City: this.DonorInfoCity?.value,
            State: this.DonorInfoState?.value,
            AddressZip: this.DonorInfoZip?.value,
            PaymentDetails: paymentDetails,
            PaymentRecurringModel: paymentRecurringModel,
            Latitude: null,
            Longitude: null,
            CCNum: this.PaymentCardNumber?.value,
            Expiry: this.PaymentExp?.value,
            Cvv: this.isCvvVisible ? this.PaymentCVV?.value : '',
            Note: this.PaymentNote?.value ? this.PaymentNote.value : '',
            Recapcha: this.recaptchaToken,
            questionGuId: this.questionGuid,
            questionAnswer: this.questionAnswer,
          };

          this.isLoading = true;
          this.paymentService.DevicePay(payload).subscribe(
            (res) => {
              this.isLoading = false;
              if (res.paymentStatus == 'Success') {
                this.paymentSuccess = true;
                const modal = this.commonMethodService.openPopup(
                  thankYouModalContent,
                  {
                    centered: true,
                    size: 'lg',
                    backdrop: 'static',
                    keyboard: true,
                    windowClass: 'drag_popup thank-you-success',
                  }
                );

                modal.result
                  .then((res) => {
                    window.location.reload();
                  })
                  .catch((error) => {
                    console.error('You must be a developer!');
                  })
                  .then(() => {
                    window.location.reload();
                  });

                return;
              }

              this.paymentSuccess = false;
              this.paymentError = res.errorResponse || '';
              const modal = this.commonMethodService.openPopup(
                thankYouModalContent,
                {
                  centered: true,
                  size: 'lg',
                  backdrop: 'static',
                  keyboard: true,
                  windowClass: 'drag_popup thank-you-error',
                }
              );
              modal.result.then((response) => {
                if (response) {
                  this.isCompleteClicked = false;
                  this.isPaymentClickInProgress = false;
                }
              });
            },
            (err) => {
              this.isPaymentClickInProgress = false;
              this.isLoading = false;
              this.paymentSuccess = false;
              this.isCompleteClicked = false;
              this.paymentError = err.error;
              if (err.error == 'Additional validation needed') {
                this.getQuestionSetting();
              } else {
                this.commonMethodService.openPopup(thankYouModalContent, {
                  centered: true,
                  size: 'lg',
                  backdrop: 'static',
                  keyboard: true,
                  windowClass: 'drag_popup thank-you-error',
                });
              }
            }
          );
        }
      },
      (errr) => {
        this.isLoading = false;
        this.isPaymentClickInProgress = false;
        //  this.notificationService.showError('Sorry', 'Error !');
      }
    );
  }

  elementScrolled(index: number) {
    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();

    if (end < total) {
      return;
    }

    if (isNaN(index) || this.isLoading) {
      return;
    }

    if (this.hasAllDonor) {
      return;
    }

    if (index + 1 === this.donatePageData.lstDonorDonation.length) {
      this.isLoading = true;
      this.getDonateDonors();
    }
  }

  getDonateDonors() {
    this.donatePageAPI
      .getDonateDonors(this.macAddress ? this.macAddress : '')
      .subscribe(
        (res) => {
          this.isLoading = false;
          this.hasAllDonor = true;
          if (
            res &&
            res.lstDonorDonation &&
            res.lstDonorDonation.length !== 0
          ) {
            this.leftDonorFilterService.ListData = res.lstDonorDonation || [];
            if (this.sortUpdate == 'direction') this.changeSortDirection();
            else if (this.sortUpdate == 'sortBy') this.updateSortBy();
          }
        },
        (err) => {
          this.isLoading = false;
        }
      );
  }

  isHebrew(value: string) {
    return /[\u0590-\u05FF]/.test(value);
  }

  phoneZerosValidation() {
    if (
      this.DonorInfoPhoneNumber?.invalid &&
      this.DonorInfoPhoneNumber.value == '0000000000'
    ) {
      this.isPhoneZerosValidation = true;
      return;
    }
    this.isPhoneZerosValidation = false;
  }

  isCvvHideShow(cardNumber: any) {
    let creditCardNumber = cardNumber.substring(0, 3);
    var firstFourDigit = cardNumber.substring(0, 4);
    if (
      creditCardNumber == '659' ||
      firstFourDigit === '8628' ||
      firstFourDigit === '6900'
    ) {
      this.isCvvVisible = false;
      return;
    }
    this.isCvvVisible = true;
    this.updateCVVValidation();
  }

  isDonarsFundPledgerShowHideIcon(creditCardNumber: any) {
    let twoDigit = creditCardNumber.substring(0, 2);
    let threeDigit = creditCardNumber.substring(0, 3);
    let sixDigit = creditCardNumber.substring(0, 6);
    if (threeDigit == '659' && sixDigit != '659999') {
      this.isPledgerCard = true;
      this.isDonorFundCard = true;
      this.paymentCardType = 'pledger';
      this.isDiner = false;
    } else {
      this.isDonorFundCard = false;
      this.isPledgerCard = false;
      this.isDiner = false;
    }
    if (sixDigit == '659999') {
      this.isDonorFundCard = true;
      this.isPledgerCard = false;
      this.paymentCardType = 'donorsfund';
      this.isDiner = false;
    }
    if (sixDigit != '659999' && sixDigit.length > 5) {
      this.isDonorFundCard = false;
      this.isDiner = false;
    }
    if (
      twoDigit == '36' ||
      twoDigit == '38' ||
      twoDigit == '39' ||
      threeDigit == '300' ||
      threeDigit == '301' ||
      threeDigit == '302' ||
      threeDigit == '303' ||
      threeDigit == '304' ||
      threeDigit == '305'
    ) {
      this.isDiner = true;
    }
  }

  donationAmountIncreasedPopup(tabId: string, amountIncreaseContent: any) {
    if (this.totalDonation != this.DonateAmount?.value) {
      if (this.SelectedTeams.length > 1) {
        const teams: Array<{ amount: string }> =
          this.SelectedTeams.getRawValue();
        const totalDonation = teams.reduce((prev, current) => {
          return prev + +current.amount;
        }, 0);

        const modal = this.commonMethodService.openPopup(
          amountIncreaseContent,
          {
            size: 'md',
            backdrop: 'static',
            keyboard: true,
            windowClass: 'drag_popup amount-increased-modal',
          }
        );

        this.totalDonation = this.convertStringToNumber(
          totalDonation.toString()
        );

        this.isDonarInfo = true;
        this.ngbTabset.select('tab-selectbyid2');
        modal.result
          .then(() => {
            this.isDonarInfo = false;
            this.formatAmt$.next(totalDonation.toString());

            this.recurringFormatAmt$.next(totalDonation.toString());
            this.ngbTabset.select(tabId);
          })
          .catch(() => { });
        return;
      }
    }
  }

  updateCVVValidation() {
    const cvvControl = this.paymentFormGroup.get('cvv');

    if (cvvControl) {
      // Update the validation based on the card type
      if (!this.isCvvVisible) {
        cvvControl.clearValidators(); // Remove required validator for charity card
      } else {
        let minLength = this.paymentCardType == 'Amex' ? 4 : 3;
        cvvControl.setValidators([
          Validators.required,
          Validators.minLength(minLength),
          Validators.maxLength(4),
        ]); // Add required validator for other card types
      }
      cvvControl.updateValueAndValidity();
    }
  }
  get donationAmountFormat() {
    if (!this.DonateAmount?.value) {
      return;
    }

    const amount = (
      Number(this.DonateAmount?.value) / Number(this.RecurringCount?.value)
    ).toFixed(2);
    return this.isScheduleRecurringDonation
      ? `${this.symbol}${amount} X ${this.RecurringCount?.value}`
      : this.symbolDonateAmount;
  }
  get symbolDonateAmount() {
    if (!this.DonateAmount?.value) {
      return;
    }
    return `${this.symbol}${this.DonateAmount?.value}`;
  }

  convertStringToNumber(originalString: string): number {
    let parsedNumber: number = parseFloat(originalString);
    if (!isNaN(parsedNumber)) {
      parsedNumber = parseFloat(parsedNumber.toFixed(2)); // Round to 2 decimal places
      return parsedNumber;
    } else {
      // Handle invalid input or error condition
      return NaN;
    }
  }

  useLanguage(language: string): void {
    localStorage.setItem('defaultLangAPI', 'True');
    if (
      this.translate.currentLang == 'en' ||
      this.translate.currentLang == undefined
    ) {
      this.commonMethodService.isHebrew = true;
      $('body').addClass('rtl');
      this.translate.use('heb');
    } else {
      this.commonMethodService.isHebrew = false;
      $('body').removeClass('rtl');
      this.translate.use('en');
    }
    this.commonMethodService.setGlobalLang(this.commonMethodService.isHebrew);
    this.hebrewFrequency();
  }

  hebrewFrequency() {
    if (this.commonMethodService.isHebrew) {
      this.frequencyListOptions = this.donatePageData.lstSetting
        .filter((o) => o.name === 'Frequency')
        .sort((a, b) => {
          const valueA = a.value;
          const valueB = b.value;

          // Check if the values are Hebrew
          const isHebrewA = /[א-ת]/.test(valueA);
          const isHebrewB = /[א-ת]/.test(valueB);

          // If one is Hebrew and the other is not, move the Hebrew value to the top
          if (isHebrewA && !isHebrewB) {
            return -1;
          } else if (!isHebrewA && isHebrewB) {
            return 1;
          }

          // If both are Hebrew or both are not, maintain the original order
          return 0;
        });
      return;
    }

    if (!this.commonMethodService.isHebrew) {
      this.frequencyListOptions = this.donatePageData.lstSetting.filter(
        (o) => o.name === 'Frequency'
      );
      return;
    }
  }

  donorInfoRemoveValidation() {
    this.donorInfoFormGroup.get('PhoneNumber')?.clearValidators();
    this.donorInfoFormGroup.get('Email')?.clearValidators();
    this.donorInfoFormGroup.get('FirstName')?.clearValidators();
    this.donorInfoFormGroup.get('LastName')?.clearValidators();
    this.donorInfoFormGroup.get('StreetName')?.clearValidators();
    this.donorInfoFormGroup.get('City')?.clearValidators();
    this.donorInfoFormGroup.get('State')?.clearValidators();
    this.donorInfoFormGroup.get('Zip')?.clearValidators();
    this.donorInfoFormGroup.updateValueAndValidity();
  }

  /** it assigns options to display in select drpdwn to sortOptionsToDisplay based on active tab
   * and update default selected value in drpdwn
   */
  setSorByOptions(id: number) {
    this.activeTabId = id;
    this.activeTabChanged = true;
    this.sortDirection = 'desc';
    if (id == 1) {
      this.sortOptionsToDisplay = this.donorPanelSortByOptions;
      this.sortBy = this.defaultSortBy?.donors;
      this.leftDonorFilterService.sortDirection = this.sortDirection;
    } else if (id == 2) {
      this.sortOptionsToDisplay = this.teamsPanelSortByOptions;
      this.sortBy = this.defaultSortBy?.teams;
      this.leftTeamFilterService.sortDirection = this.sortDirection;
    } else if (id == 3) {
      this.sortOptionsToDisplay = this.groupPanelSortByOptions;
      this.sortBy = this.defaultSortBy?.group;
      this.leftGroupFilterService.sortDirection = this.sortDirection;
    }
  }

  /** updates the sort direction */
  changeSortDirection() {
    if (!this.hasAllDonor && this.activeTabId == 1 && !this.activeTabChanged) {
      this.sortUpdate = 'direction';
      this.getDonateDonors();
    } else {
      this.sortDirection = this.sortDirection == 'desc' ? 'asc' : 'desc';
      if (this.activeTabId == 1)
        this.leftDonorFilterService.sortDirection = this.sortDirection;
      else if (this.activeTabId == 2)
        this.leftTeamFilterService.sortDirection = this.sortDirection;
      else if (this.activeTabId == 3)
        this.leftGroupFilterService.sortDirection = this.sortDirection;
      if (this.activeTabChanged) this.updateSortBy();
    }

  }

  /** sets the sortBy value based on active tab
   * and assings sortBy object (selected from drpdwn) to defaultSortBy's key based on active tab
   * to remember the value on tab change.
   */

  updateSortBy(updateDirection = false) {
    if (updateDirection) {
      this.sortDirection = 'desc';
      if (this.sortBy.key == 'reasonName') this.sortDirection = 'asc';
    }
    this.activeTabChanged = false;
    if (!this.hasAllDonor && this.activeTabId == 1) {
      this.sortUpdate = 'sortBy';
      this.getDonateDonors();
    } else {
      if (this.sortBy?.sortByFunction && this.activeTabId == 2) {
        this.onSortLstDonorReasons();
        this.defaultSortBy.teams = this.sortBy;
        this.leftTeamFilterService.sortDirection = this.sortDirection;
      } else {
        if (this.activeTabId == 1) {
          this.leftDonorFilterService.sortDirection = this.sortDirection;
          this.leftDonorFilterService.sortColumn = this.sortBy.key;
          this.defaultSortBy.donors = this.sortBy;
        } else if (this.activeTabId == 2) {
          this.leftTeamFilterService.sortDirection = this.sortDirection;
          this.leftTeamFilterService.sortColumn = this.sortBy.key;
          this.defaultSortBy.teams = this.sortBy;
        } else if (this.activeTabId == 3) {
          this.leftGroupFilterService.sortDirection = this.sortDirection;
          this.leftGroupFilterService.sortColumn = this.sortBy.key;
          this.defaultSortBy.group = this.sortBy;
        }
      }
    }
  }
}
