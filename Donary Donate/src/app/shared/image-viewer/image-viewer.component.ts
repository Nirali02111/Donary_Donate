import { Component, Input, input, OnInit, Signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SlickCarouselModule } from 'ngx-slick-carousel';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [SlickCarouselModule],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
})
export class ImageViewerComponent implements OnInit {
  images = input<any[]>([]);
  image = input<string>('');
  @Input('imageNumber') imageNumber!: number;
  slideConfig: any = {
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: '<button type="button" class="slick-next"> > </button>',
    prevArrow: '<button type="button" class="slick-prev"> < </button>',
    arrows: false,
    draggable: false,
    adaptiveHeight: true,
  };

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.slideConfig['initialSlide'] = this.imageNumber;
  }

  closeModal() {
    this.activeModal.close();
  }
}
