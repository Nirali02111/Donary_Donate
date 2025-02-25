import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddressAutocompleteDirective } from './address-autocomplete.directive';
import { FilterDataPipe } from './filter-data.pipe';
import { GoogleMapService } from 'src/app/services/google-map.service.service';
import { DocumentRef, WindowRef } from 'src/app/@models/Platform';

export const BROWSER_GLOBALS_PROVIDERS: Provider[] = [WindowRef, DocumentRef];

@NgModule({
    imports: [CommonModule, AddressAutocompleteDirective, FilterDataPipe],
    exports: [AddressAutocompleteDirective, FilterDataPipe],
    providers: [BROWSER_GLOBALS_PROVIDERS, GoogleMapService, FilterDataPipe],
})
export class DoanryDirective {}
