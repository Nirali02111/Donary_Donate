import { Component, Input, OnInit } from '@angular/core';
import { CommonMethodService } from 'src/app/commons/common-methods.service';
import { DonorDonationObj } from 'src/app/services/donate-page-api.service';

@Component({
  selector: '[app-donate-donor-list-item]',
  templateUrl: './donate-donor-list-item.component.html',
  styleUrls: ['./donate-donor-list-item.component.scss'],
})
export class DonateDonorListItemComponent implements OnInit {
  @Input() item!: DonorDonationObj;

  constructor(public commonMethodService: CommonMethodService) {}

  ngOnInit() {}
}
