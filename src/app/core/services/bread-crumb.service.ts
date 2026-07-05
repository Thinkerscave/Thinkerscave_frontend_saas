import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppPageHeader {
  title?: string;
  subtitle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadCrumbService {
  private readonly pageHeaderSource = new BehaviorSubject<AppPageHeader | null>(null);
  readonly pageHeader$ = this.pageHeaderSource.asObservable();

  private state: AppPageHeader = {};

  /** Override shell title/subtitle for dynamic pages (e.g. customer detail). */
  setPageHeader(header: AppPageHeader | null): void {
    if (!header) {
      this.state = {};
      this.pageHeaderSource.next(null);
      return;
    }
    this.state = { ...this.state, ...header };
    this.pageHeaderSource.next({ ...this.state });
  }

  /** Page toolbar registers its subtitle so it renders under the shell title. */
  setPageSubtitle(subtitle: string | null | undefined): void {
    if (subtitle) {
      this.state = { ...this.state, subtitle };
    } else {
      const { subtitle: _, ...rest } = this.state;
      this.state = rest;
    }
    this.pageHeaderSource.next(Object.keys(this.state).length ? { ...this.state } : null);
  }

  clearPageHeader(): void {
    this.state = {};
    this.pageHeaderSource.next(null);
  }

  /** @deprecated Side-menu legacy hook — shell breadcrumb is route-driven now. */
  setBreadcrumb(_menu: string, _subMenu: string): void {
    // no-op: kept so side-menu navigation does not break callers
  }
}
