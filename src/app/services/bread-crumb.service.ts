import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BreadCrumbService {

  private breadcrumbSource = new BehaviorSubject<{ menu: string, subMenu: string } | null>(null);
  breadcrumb$ = this.breadcrumbSource.asObservable();

  setBreadcrumb(menu: string, subMenu: string) {
    this.breadcrumbSource.next({ menu, subMenu });
  }
}
