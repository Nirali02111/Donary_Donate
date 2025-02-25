import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[appIsHebrew]',
})
export class IsHebrewDirective implements OnInit {
  @HostBinding('class.lang-hebrew') get valid() {
    return this.check();
  }

  // tslint:disable-next-line: no-input-rename
  @Input('content') content!: string | any;
  constructor(private elementHost: ElementRef) {}

  ngOnInit(): void {
    /*if (this.check()) {
      this.elementHost.nativeElement.classList.add("lang-hebrew");
    }*/
  }

  check(): boolean {
    if (this.content) {
      return /[\u0590-\u05FF]/.test(this.content);
    }

    return false;
  }
}
