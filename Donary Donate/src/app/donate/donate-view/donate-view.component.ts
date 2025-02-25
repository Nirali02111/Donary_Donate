import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { PageRouteVariable } from 'src/app/commons/page-route-variable';
import { MainAPIService } from 'src/app/services/main-api.service';

export {};
declare global {
  interface Window {
    Calendly: any;
  }
}

declare const window: Window &
  typeof globalThis & {
    RequestAnimationFrame?: any;
    CancelAnimationFrame?: any;
    CancelRequestAnimationFrame?: any;

    mozRequestAnimationFrame?: any;
    webkitRequestAnimationFrame?: any;
    msRequestAnimationFrame?: any;
    oRequestAnimationFrame?: any;

    mozCancelAnimationFrame?: any;
    webkitCancelAnimationFrame?: any;
    msCancelAnimationFrame?: any;
    oCancelAnimationFrame?: any;
    mozCancelRequestAnimationFrame?: any;
    webkitCancelRequestAnimationFrame?: any;
    msCancelRequestAnimationFrame?: any;
    oCancelRequestAnimationFrame?: any;
  };

function scroll(element: any) {
  let start: any = null;
  const target = element && element ? element.getBoundingClientRect().top : 0;
  const firstPos = window.pageYOffset || document.documentElement.scrollTop;
  let pos = 0;

  const requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame;

  const cancelAnimationFrame =
    window.mozCancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame;

  function showAnimation(timestamp: any) {
    if (!start) {
      start = timestamp || new Date().getTime();
    }

    const elapsed = timestamp - start;
    const progress = elapsed / 800; // animation duration 600ms

    const outQuad = (n: any) => {
      return n * (2 - n);
    };

    const easeInPercentage = +outQuad(progress).toFixed(2);

    pos =
      target === 0
        ? firstPos - firstPos * easeInPercentage
        : firstPos + target * easeInPercentage;

    window.scrollTo(0, pos);
    // console.log(pos, target, firstPos, progress);

    if (
      (target !== 0 && pos >= firstPos + target) ||
      (target === 0 && pos <= 0)
    ) {
      cancelAnimationFrame(start);
      if (element) {
        element.focus();
      }
      pos = 0;
    } else {
      requestAnimationFrame(showAnimation);
    }
  }

  requestAnimationFrame(showAnimation);
}

@Component({
  selector: 'app-donate-view',
  templateUrl: './donate-view.component.html',
  styleUrls: ['./donate-view.component.scss'],
})
export class DonateViewComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading = false;
  isMapImg = true;
  phoneMask = '(000)-000-0000';
  attachFilename = '';
  alertMessage = '';
  alertType = 'danger';
  public currentYear: number = new Date().getFullYear();

  @ViewChild('contact', { static: false }) contactSection!: ElementRef;

  private _subscriptions: Subscription = new Subscription();

  contactFormGroup!: FormGroup;

  get fullName() {
    return this.contactFormGroup.get('FullName');
  }

  get emailAddress() {
    return this.contactFormGroup.get('EmailAddress');
  }

  get phoneNumber() {
    return this.contactFormGroup.get('PhoneNumber');
  }

  get subject() {
    return this.contactFormGroup.get('Subject');
  }

  get msgBody() {
    return this.contactFormGroup.get('Body');
  }

  public get Attachments(): FormArray {
    return this.contactFormGroup.get('Attachments') as FormArray;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private mainAPIService: MainAPIService,
    private renderer: Renderer2
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
    this.router.onSameUrlNavigation = 'reload';
  }

  ngOnInit() {
    this.currentYear = new Date().getFullYear();

    this.contactFormGroup = this.fb.group({
      FullName: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),
      EmailAddress: this.fb.control(
        null,
        Validators.compose([Validators.required, Validators.email])
      ),
      PhoneNumber: this.fb.control(
        null,
        Validators.compose([Validators.required])
      ),
      Subject: this.fb.control(null, Validators.compose([Validators.required])),
      Body: this.fb.control(null, Validators.compose([Validators.required])),
      Attachments: this.fb.array([]),
    });
  }

  ngAfterViewInit(): void {
    this._subscriptions = this.route.fragment
      .pipe(first())
      .subscribe((fragment) => {
        if (fragment === 'contact_section') {
          scroll(this.contactSection.nativeElement);
        }
      });
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  get ProductAndPlanLink() {
    return `https://p.donary.com/productandplans`;
  }

  getDonateRoute() {
    return [`/`];
  }

  getScheduleDemoRoute() {
    return [`/${PageRouteVariable.schedule_demo_url}`];
  }

  mapToggle() {
    this.isMapImg = !this.isMapImg;
  }

  openSchedule() {
    window.Calendly.initPopupWidget({
      url: 'https://calendly.com/donary/15min?text_color=21263d&primary_color=7B5BC4',
    });
  }

  getBase64String(event: any) {
    let selectedFile = event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    this.attachFilename = selectedFile.name;
    this.Attachments.clear();
    this.Attachments.push(
      this.fb.group({
        FileName: this.fb.control(null),
        FileBase64: this.fb.control(null),
      })
    );
    reader.onload = this.handleReaderLoaded.bind(this);
  }

  handleReaderLoaded(e: any) {
    // console.log(e);
    const base64textString = (e.target.result || 'base64,').split('base64,')[1];
    // console.log(base64textString);
    this.contactFormGroup.patchValue({
      Attachments: [
        {
          FileName: this.attachFilename,
          FileBase64: base64textString,
        },
      ],
    });
  }

  onContactSubmit() {
    if (this.contactFormGroup.invalid) {
      this.contactFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.mainAPIService.contactUs({ ...this.contactFormGroup.value }).subscribe(
      (res) => {
        this.isLoading = false;
        this.alertMessage = res;
        this.alertType = 'success';
        this.contactFormGroup.reset();
      },
      (err) => {
        this.isLoading = false;
        console.log(err.error);
        this.alertMessage = err.error;
        this.alertType = 'danger';
      }
    );
  }
}
