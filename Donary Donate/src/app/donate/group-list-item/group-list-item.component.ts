import { Component, Input, OnInit } from '@angular/core';
import { CommonMethodService } from 'src/app/commons/common-methods.service';
import {
  LstGroupObj,
  DonorDonationObj,
  LstDonateReasonObj,
  LstDonorDonationObj,
  DonatePageAPIService,
} from 'src/app/services/donate-page-api.service';

@Component({
  selector: 'app-group-list-item',
  templateUrl: './group-list-item.component.html',
  styleUrls: ['./group-list-item.component.scss'],
})
export class GroupListItemComponent implements OnInit {
  isOpen = true;

  isOpenInGroup = false;

  selectedReasonInGroup!: any;

  listDonateDonors: Array<DonorDonationObj> = [];

  @Input() item!: LstGroupObj;

  @Input() macAddress = '';

  @Input() donateReasons!: Array<LstDonateReasonObj>;

  @Input() donateDonors!: Array<LstDonorDonationObj>;

  @Input() displayLang!: string

  engLang: string = 'English'

  constructor(
    public commonMethodService: CommonMethodService,
    private donatePageAPI: DonatePageAPIService
  ) { }

  ngOnInit() {
    this.getDonors();
  }

  onExpand() {
    this.isOpen = true;
    this.getDonors();
  }

  onCollapse() {
    this.isOpen = false;
  }

  onExpandInGroup() {
    this.isOpenInGroup = true;
  }

  onCollapseInGroup() {
    this.isOpenInGroup = false;
  }

  onToggleInGroup(reasonId: any) {
    this.selectedReasonInGroup = reasonId;
    this.isOpenInGroup = !this.isOpenInGroup;
  }

  getDonors() {
    this.donatePageAPI.getDonateDonors(this.macAddress).subscribe((res) => {
      if (res && res.lstDonorDonation && res.lstDonorDonation.length !== 0) {
        this.listDonateDonors = res.lstDonorDonation;
      }
    });
  }
}
