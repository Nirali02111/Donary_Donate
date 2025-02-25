import { Component, Input } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
})
export class SkeletonLoaderComponent {
  @Input() count: number = 6;

  @Input() theme: { [k: string]: string } = {
    width: '100%',
    height: '40px',
  };

  @Input() appearance = '';
  constructor() {}

  ngOnInit() {}
}
