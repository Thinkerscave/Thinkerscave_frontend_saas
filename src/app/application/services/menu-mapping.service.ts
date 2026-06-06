import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { catchError, map, Observable, of, Subject, tap, throwError } from 'rxjs';
import { menuMappingeApi } from '../../shared/constants/api_menu.endpoint';
import { unwrapApiList } from '../../shared/utils/api-response.util';
import { normalizePrimeIcon } from '../../shared/utils/prime-icon.util';

interface WorkspaceMenuLeaf {
  item: MenuItem;
  path: string[];
  routeText: string;
  groupKey: string;
}

interface WorkspaceMenuGroupDefinition {
  key: string;
  label: string;
  icon: string;
}

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
        return of(this.applyNavigationRules(this.consolidateWorkspaceMenu(this.normalizeMenuItems(counsellorMenu))));
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
        return of(this.applyNavigationRules(this.consolidateWorkspaceMenu(this.normalizeMenuItems(adminFeeMenu))));
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
        return this.applyNavigationRules(this.consolidateWorkspaceMenu(this.normalizeMenuItems(unwrapApiList<MenuItem>(response))));
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
      routerLink: this.normalizeRouterLink(item.routerLink),
      items: item.items ? this.normalizeMenuItems(item.items) : item.items
    }));
  }

  private normalizeRouterLink(routerLink: MenuItem['routerLink']): MenuItem['routerLink'] {
    if (!routerLink || Array.isArray(routerLink) || typeof routerLink !== 'string') {
      return routerLink;
    }

    const link = routerLink.trim();
    if (!link || link.startsWith('/app') || link.startsWith('/auth') || link.startsWith('/public') || /^https?:\/\//i.test(link)) {
      return routerLink;
    }

    if (link.startsWith('app/')) {
      return `/${link}`;
    }

    return `/app/${link.replace(/^\/+/, '')}`;
  }

  private consolidateWorkspaceMenu(items: MenuItem[]): MenuItem[] {
    const leaves = this.uniqueLeaves(this.flattenMenuItems(items));
    if (!leaves.length) {
      return items;
    }

    const grouped = this.workspaceGroups()
      .map(group => this.toWorkspaceGroup(group, leaves.filter(leaf => leaf.groupKey === group.key)))
      .filter((item): item is MenuItem => !!item);

    const uncategorized = leaves.filter(leaf => leaf.groupKey === 'more');
    if (uncategorized.length) {
      grouped.push(this.toWorkspaceGroup({ key: 'more', label: 'More', icon: 'pi pi-ellipsis-h' }, uncategorized)!);
    }

    return grouped;
  }

  private workspaceGroups(): WorkspaceMenuGroupDefinition[] {
    return [
      { key: 'dashboard', label: 'Dashboard', icon: 'pi pi-home' },
      { key: 'students', label: 'Students', icon: 'pi pi-users' },
      { key: 'staff', label: 'Staff', icon: 'pi pi-id-card' },
      { key: 'attendance', label: 'Attendance', icon: 'pi pi-calendar-check' },
      { key: 'admissions', label: 'Admissions', icon: 'pi pi-inbox' },
      { key: 'academics', label: 'Academics', icon: 'pi pi-book' },
      { key: 'finance', label: 'Finance', icon: 'pi pi-wallet' },
      { key: 'exams', label: 'Exams', icon: 'pi pi-file-check' },
      { key: 'communication', label: 'Communication', icon: 'pi pi-send' },
      { key: 'tenant-management', label: 'Tenant Management', icon: 'pi pi-building' },
      { key: 'admin', label: 'Administration', icon: 'pi pi-shield' }
    ];
  }

  private toWorkspaceGroup(group: WorkspaceMenuGroupDefinition, leaves: WorkspaceMenuLeaf[]): MenuItem | null {
    if (!leaves.length) {
      return null;
    }

    const first = leaves[0].item;
    const childItems = leaves.map(leaf => ({
      ...leaf.item,
      items: undefined,
      title: leaf.path.slice(0, -1).join(' / ') || leaf.item.title
    }));

    if (group.key === 'dashboard' && childItems.length === 1) {
      return {
        ...first,
        label: group.label,
        icon: group.icon,
        items: undefined
      };
    }

    return {
      label: group.label,
      icon: group.icon,
      routerLink: first.routerLink,
      queryParams: first.queryParams,
      items: childItems
    };
  }

  private flattenMenuItems(items: MenuItem[], parents: string[] = []): WorkspaceMenuLeaf[] {
    return (items ?? []).flatMap(item => {
      const label = item.label ?? 'Menu item';
      const path = [...parents, label];
      const routeText = this.routerLinkText(item.routerLink);
      const current: WorkspaceMenuLeaf[] = routeText ? [{
        item,
        path,
        routeText,
        groupKey: this.workspaceGroupKey(label, routeText, path)
      }] : [];

      return [...current, ...this.flattenMenuItems(item.items ?? [], path)];
    });
  }

  private uniqueLeaves(leaves: WorkspaceMenuLeaf[]): WorkspaceMenuLeaf[] {
    const seen = new Set<string>();
    return leaves.filter(leaf => {
      const key = `${leaf.routeText}::${leaf.item.label ?? ''}::${JSON.stringify(leaf.item.queryParams ?? {})}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private routerLinkText(routerLink: MenuItem['routerLink']): string {
    if (!routerLink) {
      return '';
    }

    return Array.isArray(routerLink) ? routerLink.join('/') : String(routerLink);
  }

  private workspaceGroupKey(label: string, routeText: string, path: string[]): string {
    const haystack = `${label} ${routeText} ${path.join(' ')}`.toLowerCase();
    const route = routeText.toLowerCase();

    if (/^\/?app\/?$/.test(route)) return 'dashboard';
    if (route.includes('/app/tenant-management') || route.includes('/app/platform') || route.includes('/app/admin/organizations') || route.includes('/app/organization-registration')) return 'tenant-management';
    if (route.includes('/app/organization')) return 'admin';
    if (route.includes('/app/admin')) return 'admin';
    if (route.includes('/app/academics')) return 'academics';
    if (route.includes('/app/students') || /managestudent|manage-class|manage-section/.test(route)) return 'students';
    if (route.includes('/app/staff') || /salary|leave|manage-branch|manage-department/.test(route)) return 'staff';
    if (route.includes('/app/attendance')) return 'attendance';
    if (route.includes('/app/inquiry') || route.includes('/app/counsellor') || route.includes('/public/admission')) return 'admissions';
    if (route.includes('/app/fees') || route.includes('/app/reports')) return 'finance';

    if (/academic|academics|subject|syllabus|curriculum|timetable|calendar|teacher-allocation|hierarchy|year|course/.test(haystack)) return 'academics';
    if (/student|parent|alumni|class|section|promotion|transfer|document|id-card/.test(haystack)) return 'students';
    if (/staff|employee|salary|leave|payroll|department|branch/.test(haystack)) return 'staff';
    if (/attendance|present|absent/.test(haystack)) return 'attendance';
    if (/inquiry|admission|lead|counsellor|counseling|enrollment|application|follow-up/.test(haystack)) return 'admissions';
    if (/fee|fees|finance|payment|receipt|ledger|contract|adjustment|concession|collection|outstanding|report/.test(haystack)) return 'finance';
    if (/exam|marks|mark sheet|marksheet|grade|result/.test(haystack)) return 'exams';
    if (/communication|message|notice|notification|email|sms|chat/.test(haystack)) return 'communication';
    if (/tenant management|subscription plan|tenant onboarding|organization directory|organization management/.test(haystack)) return 'tenant-management';
    if (/platform control|my organization/.test(haystack)) return 'admin';
    if (/admin|administration|role|permission|access|audit|monitoring|setting|menu|privilege|navigation|system/.test(haystack)) return 'admin';
    if (/\bdashboard\b/.test(haystack)) return 'dashboard';

    return 'more';
  }

  private applyNavigationRules(items: MenuItem[]): MenuItem[] {
    const roles = this.currentRoleTokens();
    const isTenantManager = this.hasAnyRole(roles, ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'THINKERSCAVE_INTERNAL', 'INTERNAL_TEAM']);

    let menus = this.normalizeTenantRoutes(items);

    if (!isTenantManager) {
      menus = this.filterNavigationItems(menus, item => this.isTenantManagementItem(item));
    }

    menus = this.filterNavigationItems(menus, item => this.isOrganizationProfileItem(item));

    if (isTenantManager) {
      menus = this.ensureMenuGroup(menus, this.tenantManagementMenuGroup());
    }

    return menus;
  }

  private normalizeTenantRoutes(items: MenuItem[]): MenuItem[] {
    return (items ?? []).map(item => {
      const route = this.routerLinkText(item.routerLink).toLowerCase();
      const isLegacyOrganization = route.includes('/app/admin/organizations') || route.includes('/app/organization-registration');
      const normalizedRouterLink = this.normalizedTenantRouterLink(route, item.routerLink, isLegacyOrganization);
      return {
        ...item,
        label: this.normalizedTenantLabel(item.label, route, isLegacyOrganization),
        routerLink: normalizedRouterLink,
        items: item.items ? this.normalizeTenantRoutes(item.items) : item.items
      };
    });
  }

  private normalizedTenantRouterLink(route: string, routerLink: MenuItem['routerLink'], isLegacyOrganization: boolean): MenuItem['routerLink'] {
    if (isLegacyOrganization) {
      return ['/app/tenant-management/organizations'];
    }
    if (route.includes('/app/platform/dashboard') || route === '/app/platform') {
      return ['/app/tenant-management/organizations'];
    }
    if (route.includes('/app/platform/organizations')) {
      return Array.isArray(routerLink) && this.routerLinkText(routerLink).includes(':orgId') ? routerLink : ['/app/tenant-management/organizations'];
    }
    if (route.includes('/app/platform/subscriptions')) {
      return ['/app/tenant-management/subscription-plans'];
    }
    if (route.includes('/app/platform/audit')) {
      return ['/app/tenant-management/audit-center'];
    }
    return routerLink;
  }

  private normalizedTenantLabel(label: string | undefined, route: string, isLegacyOrganization: boolean): string | undefined {
    if (route.includes('/app/platform') && /platform control/i.test(label ?? '')) {
      return 'Tenant Management';
    }
    if (isLegacyOrganization && /registration|management/i.test(label ?? '')) {
      return 'Organizations';
    }
    if (route.includes('/app/platform/subscriptions')) {
      return 'Subscription Plans';
    }
    if (route.includes('/app/platform/audit')) {
      return 'Audit Center';
    }
    return label;
  }

  private ensureMenuGroup(items: MenuItem[], menuItem: MenuItem): MenuItem[] {
    if (this.containsRoute(items, this.routerLinkText(menuItem.routerLink))) {
      return items;
    }

    const dashboardIndex = items.findIndex(item => this.routerLinkText(item.routerLink) === '/app' || item.label === 'Dashboard');
    const next = [...items];
    next.splice(dashboardIndex >= 0 ? dashboardIndex + 1 : next.length, 0, menuItem);
    return next;
  }

  private tenantManagementMenuGroup(): MenuItem {
    return {
      label: 'Tenant Management',
      icon: 'pi pi-building',
      routerLink: ['/app/tenant-management/organizations'],
      items: [
        { label: 'Organizations', icon: 'pi pi-building', routerLink: ['/app/tenant-management/organizations'] },
        { label: 'Subscription Plans', icon: 'pi pi-credit-card', routerLink: ['/app/tenant-management/subscription-plans'] },
        { label: 'Audit Center', icon: 'pi pi-history', routerLink: ['/app/tenant-management/audit-center'] }
      ]
    };
  }

  private isTenantManagementItem(item: MenuItem): boolean {
    const route = this.routerLinkText(item.routerLink).toLowerCase();
    const label = (item.label ?? '').toLowerCase();
    return route.includes('/app/tenant-management') || route.includes('/app/platform') || route.includes('/app/admin/organizations') || label.includes('tenant management') || label.includes('platform control center');
  }

  private isOrganizationProfileItem(item: MenuItem): boolean {
    const route = this.routerLinkText(item.routerLink).toLowerCase();
    return route.includes('/app/organization') || route.includes('/app/organization-profile');
  }

  private filterNavigationItems(items: MenuItem[], shouldRemove: (item: MenuItem) => boolean): MenuItem[] {
    const filteredItems: MenuItem[] = [];

    (items ?? []).forEach(item => {
      if (shouldRemove(item)) {
        return;
      }

      const children = item.items ? this.filterNavigationItems(item.items, shouldRemove) : undefined;
      if (item.items && !children?.length && !item.routerLink) {
        return;
      }

      filteredItems.push({
        ...item,
        items: children?.length ? children : undefined
      });
    });

    return filteredItems;
  }

  private containsRoute(items: MenuItem[], routeText: string): boolean {
    if (!routeText) {
      return false;
    }
    return (items ?? []).some(item => this.routerLinkText(item.routerLink) === routeText || this.containsRoute(item.items ?? [], routeText));
  }

  private currentRoleTokens(): string[] {
    const userStr = sessionStorage.getItem('user') ?? localStorage.getItem('user');
    if (!userStr) {
      return [];
    }

    try {
      const parsed = JSON.parse(userStr);
      const user = parsed?.data && parsed.firstName === undefined ? parsed.data : parsed;
      const roleValues = [user.role, user.roleCode, user.roleName, ...(Array.isArray(user.roles) ? user.roles : [])];
      return roleValues
        .flatMap((role: any) => [role?.roleCode, role?.roleName, role?.name, role])
        .filter(Boolean)
        .map((role: any) => this.normalizeRoleToken(String(role)));
    } catch {
      return [];
    }
  }

  private hasAnyRole(userRoles: string[], allowedRoles: string[]): boolean {
    const allowed = allowedRoles.map(role => this.normalizeRoleToken(role));
    return allowed.some(role => userRoles.includes(role));
  }

  private normalizeRoleToken(role: string): string {
    return role.trim().replace(/^ROLE_/i, '').replace(/[\s-]+/g, '_').toUpperCase();
  }
}
