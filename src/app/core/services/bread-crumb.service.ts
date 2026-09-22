import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppPageCrumb {
  label: string;
  link?: string[] | null;
}

export interface AppPageHeader {
  /** @deprecated Shell title comes from route pageTitle, not the selected entity. */
  title?: string;
  subtitle?: string;
  /** Optional fully-resolved trail. Last item is the current page. */
  crumbs?: AppPageCrumb[];
}

@Injectable({
  providedIn: 'root'
})
export class BreadCrumbService {
  private readonly pageHeaderSource = new BehaviorSubject<AppPageHeader | null>(null);
  readonly pageHeader$ = this.pageHeaderSource.asObservable();

  private readonly actionsSource = new BehaviorSubject<TemplateRef<unknown> | null>(null);
  readonly actions$ = this.actionsSource.asObservable();

  private state: AppPageHeader = {};
  private actionsTpl: TemplateRef<unknown> | null = null;

  /** Optional subtitle override. Do not pass entity names as title. */
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

  setActions(tpl: TemplateRef<unknown> | null): void {
    this.actionsTpl = tpl;
    this.actionsSource.next(tpl);
  }

  clearActions(tpl?: TemplateRef<unknown>): void {
    if (tpl && this.actionsTpl !== tpl) {
      return;
    }
    this.actionsTpl = null;
    this.actionsSource.next(null);
  }

  /** @deprecated Side-menu legacy hook — shell breadcrumb is route- and menu-driven now. */
  setBreadcrumb(_menu: string, _subMenu: string): void {
    // no-op: kept so side-menu navigation does not break callers
  }
}
