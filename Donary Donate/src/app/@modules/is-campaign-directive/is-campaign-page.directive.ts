import { 
  Directive,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { PageIdentityService } from 'src/app/shared/page-identity.service';

@Directive({
    selector: '[appIsCampaignPage]',
    standalone: true
})
export class IsCampaignPageDirective implements OnInit {

  constructor(
    private templateReference: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef,
    private PageIdentityService: PageIdentityService
  ) {}

  ngOnInit(): void {
    this.PageIdentityService.isCampaign
      ? this.viewContainerRef.createEmbeddedView(this.templateReference)
      : this.viewContainerRef.clear();
  }

}
