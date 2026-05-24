import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { catchError, map, Observable, of, Subject, tap, throwError } from 'rxjs';
import { menuMappingeApi } from '../../shared/constants/api_menu.endpoint';
import { unwrapApiList } from '../../shared/utils/api-response.util';
import { normalizePrimeIcon } from '../../shared/utils/prime-icon.util';

@Injectable({
  providedIn: 'root'
})
export class MenuMappingService {
  private menuCache: MenuItem[] = [];
  private readonly menuRefreshSubject = new Subject<void>();

  readonly menuRefresh$ = this.menuRefreshSubject.asObservable();

  constructor(private http: HttpClient) { }

  loadMenu(): Observable<MenuItem[]> {
    // 1. Check for specific roles (e.g., Counsellor)
    const userStr = sessionStorage.getItem('user') ?? localStorage.getItem('user');
    const accessToken = sessionStorage.getItem('accessToken') ?? localStorage.getItem('accessToken') ?? '';

    if (userStr) {
      const user = JSON.parse(userStr);

      // Mock Counsellor menu (only for mock login)
      if (user.role === 'COUNSELLOR' || (user.roles && user.roles.includes('COUNSELLOR'))) {
        const counsellorMenu: MenuItem[] = [
          {
            label: 'Overview',
            icon: 'pi pi-home',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'overview' }
          },
          {
            label: 'All Leads',
            icon: 'pi pi-list',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'all-leads' }
          },
          {
            label: 'Today\'s Follow-ups',
            icon: 'pi pi-calendar',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'today-followups' }
          },
          {
            label: 'Overdue Follow-ups',
            icon: 'pi pi-exclamation-circle',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'overdue-followups' }
          },
          {
            label: 'Interested Leads',
            icon: 'pi pi-heart-fill',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'interested-leads' }
          },
          {
            label: 'New Leads',
            icon: 'pi pi-star-fill',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'new-leads' }
          },
          {
            label: 'Statistics',
            icon: 'pi pi-chart-bar',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'lead-statistics' }
          }
        ];
        return of(this.normalizeMenuItems(counsellorMenu));
      }

      // Mock Institution Admin menu (only for mock login - detected by mock token prefix)
      if ((user.role === 'INSTITUTION_ADMIN' || (user.roles && user.roles.includes('INSTITUTION_ADMIN')))
        && accessToken.startsWith('mock_admin_')) {
        const adminFeeMenu: MenuItem[] = [
          {
            label: 'Dashboard',
            icon: 'pi pi-home',
            routerLink: ['/app/fees/dashboard']
          },
          {
            label: 'Fee Setup',
            icon: 'pi pi-cog',
            items: [
              { label: 'Overview', icon: 'pi pi-eye', routerLink: ['/app/fees/setup/overview'] },
              { label: 'Fee Policy', icon: 'pi pi-file', routerLink: ['/app/fees/setup/policy'] },
              { label: 'Fee Heads', icon: 'pi pi-list', routerLink: ['/app/fees/setup/heads'] },
              { label: 'Fee Groups', icon: 'pi pi-users', routerLink: ['/app/fees/setup/groups'] },
              { label: 'Fee Structure', icon: 'pi pi-table', routerLink: ['/app/fees/setup/structure'] }
            ]
          },
          {
            label: 'Contracts',
            icon: 'pi pi-file-edit',
            routerLink: ['/app/fees/contracts']
          },
          {
            label: 'Ledger',
            icon: 'pi pi-book',
            routerLink: ['/app/fees/ledger']
          },
          {
            label: 'Payments',
            icon: 'pi pi-credit-card',
            items: [
              { label: 'Collect Payment', icon: 'pi pi-plus', routerLink: ['/app/fees/payments'] },
              { label: 'Payment History', icon: 'pi pi-history', routerLink: ['/app/fees/payments/history'] }
            ]
          },
          {
            label: 'Receipts',
            icon: 'pi pi-receipt',
            routerLink: ['/app/fees/receipts']
          },
          {
            label: 'Adjustments',
            icon: 'pi pi-percentage',
            items: [
              { label: 'All Adjustments', icon: 'pi pi-list', routerLink: ['/app/fees/adjustments'] },
              { label: 'Create Adjustment', icon: 'pi pi-plus', routerLink: ['/app/fees/adjustments/create'] },
              { label: 'Pending Approvals', icon: 'pi pi-clock', routerLink: ['/app/fees/adjustments/pending'] },
              { label: 'Concessions', icon: 'pi pi-gift', routerLink: ['/app/fees/adjustments/concessions'] }
            ]
          },
          {
            label: 'Controls',
            icon: 'pi pi-lock',
            items: [
              { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/app/fees/controls'] },
              { label: 'Restriction Rules', icon: 'pi pi-shield', routerLink: ['/app/fees/controls/rules'] },
              { label: 'Late Fee Config', icon: 'pi pi-clock', routerLink: ['/app/fees/controls/late-fee'] },
              { label: 'Overrides', icon: 'pi pi-unlock', routerLink: ['/app/fees/controls/overrides'] }
            ]
          },
          {
            label: 'Reports',
            icon: 'pi pi-chart-bar',
            items: [
              { label: 'Reports Dashboard', icon: 'pi pi-home', routerLink: ['/app/fees/reports'] },
              { label: 'Collection Report', icon: 'pi pi-chart-line', routerLink: ['/app/fees/reports/collection'] },
              { label: 'Outstanding Report', icon: 'pi pi-exclamation-circle', routerLink: ['/app/fees/reports/outstanding'] },
              { label: 'Daily Collection', icon: 'pi pi-calendar', routerLink: ['/app/fees/reports/daily'] },
              { label: 'Defaulters List', icon: 'pi pi-users', routerLink: ['/app/fees/reports/defaulters'] }
            ]
          },
          {
            label: 'Audit Logs',
            icon: 'pi pi-history',
            routerLink: ['/app/fees/audit']
          }
        ];
        return of(this.normalizeMenuItems(adminFeeMenu));
      }
    }

    // 2. Return in-memory cache only (no localStorage — always fetch fresh on page reload)
    if (this.menuCache.length) {
      return of(this.menuCache);
    }

    // 3. Fetch from API (always fresh — localStorage cache removed to prevent stale menus)
    return this.http.get<any>(menuMappingeApi.getSideMenuUrl).pipe(
      map((response: any) => {
        // Backend wraps response in ApiResponse<T>: { success, message, data: [...] }
        // Handle both a raw array and the wrapped ApiResponse format.
        return this.normalizeMenuItems(unwrapApiList<MenuItem>(response));
      }),
      tap(menus => {
        this.menuCache = menus;
        // NOTE: intentionally NOT caching to localStorage so refreshing the page
        // always gets the latest role-menu mapping from the backend.
      }),
      catchError(err => {
        console.error('Failed to load side menus:', err);
        return throwError(() => err);
      })
    );
  }


  clearMenuCache(): void {
    this.menuCache = [];
    localStorage.removeItem('sideMenu');
  }

  refreshMenu(): void {
    this.clearMenuCache();
    this.menuRefreshSubject.next();
  }

  private normalizeMenuItems(items: MenuItem[]): MenuItem[] {
    return (items ?? []).map(item => ({
      ...item,
      icon: normalizePrimeIcon(item.icon, 'pi pi-circle'),
      items: item.items ? this.normalizeMenuItems(item.items) : item.items
    }));
  }
}
