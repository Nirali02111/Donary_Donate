import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { LocalStorageDataService } from '../shared/local-storage-data.service';
import { PageRouteVariable } from './page-route-variable';

@Injectable({
    providedIn: 'root'
})
export class NeedAuthGuardGuard  {
    campaign_login_url: string = '/' + PageRouteVariable.campaign_login_url;

    constructor(
        private router: Router, 
        private localstoragedataService: LocalStorageDataService) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
                    
        const currentUser = this.localstoragedataService.getLoginUserData();  
        if (currentUser) {
            return true;
        }
        this.router.navigate([this.campaign_login_url]);
        return false;
    }

}
