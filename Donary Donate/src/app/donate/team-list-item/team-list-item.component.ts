import { Component, Input, OnInit } from '@angular/core';
import { CommonMethodService } from 'src/app/commons/common-methods.service';
import {
  DonatePageAPIService,
  DonorDonationObj,
  LstDonateReasonObj,
} from 'src/app/services/donate-page-api.service';

@Component({
  selector: 'app-team-list-item',
  templateUrl: './team-list-item.component.html',
  styleUrls: ['./team-list-item.component.scss'],
})
export class TeamListItemComponent implements OnInit {
  isOpen = false;
  engLang: string = 'English'
  listDonateDonors: Array<DonorDonationObj> = [];

  @Input() macAddress = '';

  @Input() isExpandable!: boolean;

  @Input() item!: LstDonateReasonObj;

  @Input() displayLang: string = 'English'

  constructor(
    public commonMethodService: CommonMethodService,
    private donatePageService: DonatePageAPIService
  ) { }

  ngOnInit() { }

  onExpand() {
    this.isOpen = true;
    this.getDonors();
  }

  onCollapse() {
    this.isOpen = false;
  }

  getDonors() {
    this.donatePageService.getDonateDonors(this.macAddress).subscribe((res) => {
      if (res && res.lstDonorDonation && res.lstDonorDonation.length !== 0) {
        this.listDonateDonors = res.lstDonorDonation;
      }
    });
  }
}
