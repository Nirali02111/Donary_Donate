import { Component, Renderer2 } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent {
  tagValue!: any;

  get Src() {

    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://donarystorage.blob.core.windows.net/donaryreceipts/${this.tagValue}`)


  }
  constructor(private activeRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
  ) {

  }
  ngOnInit() {

    this.activeRoute.paramMap.subscribe((params) => {

      if (params.get(('filename'))) {

        this.tagValue = params.get('filename')

      }

    })

  }
  ngAfterViewInit() {
    let loader = this.renderer.selectRootElement('#loaderForApp');
    this.renderer.setStyle(loader, 'display', 'none');
  }
}
