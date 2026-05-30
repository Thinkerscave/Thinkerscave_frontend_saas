import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BreadCrumbService {
  private storageKey = 'app-breadcrumb';

  private breadcrumbSource = new BehaviorSubject<{ menu: string, subMenu: string } | null>(null);
  breadcrumb$ = this.breadcrumbSource.asObservable();

  constructor() {
    // ✅ Restore from storage when service is initialized
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.breadcrumbSource.next(JSON.parse(stored));
    }
  }

  setBreadcrumb(menu: string, subMenu: string) {
    const breadcrumb = { menu, subMenu };
    this.breadcrumbSource.next(breadcrumb);

    // ✅ Persist in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(breadcrumb));
  }

  clearBreadcrumb() {
    this.breadcrumbSource.next(null);
    localStorage.removeItem(this.storageKey);
  }
}
