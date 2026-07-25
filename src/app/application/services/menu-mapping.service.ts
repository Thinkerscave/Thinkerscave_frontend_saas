import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { catchError, map, Observable, of, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { isFeatureEnabled } from '../../core/config/feature-flags';
import { accessApi } from '../../shared/constants/api.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../shared/utils/api-response.util';
import { normalizePrimeIcon } from '../../shared/utils/prime-icon.util';
import { LoggerService } from '../../core/services/logger.service';

interface SidebarMenuNode {
  id?: number;
  menuCode?: string;
  menuName?: string;
  route?: string;
  icon?: string;
  children?: SidebarMenuNode[];
}

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

  constructor(
    private http: HttpClient,
    private orgContext: OrganizationContextService,
    private logger: LoggerService
  ) { }

  loadMenu(): Observable<MenuItem[]> {
    const userStr = sessionStorage.getItem('user') ?? localStorage.getItem('user');

    // Return in-memory cache only (no localStorage — always fetch fresh on page reload)
    if (this.menuCache.length) {
      return of(this.menuCache);
    }

    // Fetch sidebar from access API (role + permission aware)
    if (!userStr) {
      return of([]);
    }

    let parsedUser: { id?: string | number };
    try {
      parsedUser = JSON.parse(userStr);
      if (parsedUser && typeof parsedUser === 'object' && 'data' in parsedUser && !('id' in parsedUser)) {
        parsedUser = (parsedUser as { data: { id?: string | number } }).data;
      }
    } catch {
      return of([]);
    }

    const userId = Number(parsedUser?.id);
    // Number(null) === 0; org 0 returns an empty sidebar from the API, so skip falsy/invalid values.
    const orgId = this.resolveSidebarOrganizationId(parsedUser);

    if (!userId || Number.isNaN(userId) || !orgId) {
      return of(this.applyNavigationRules(this.consolidateWorkspaceMenu([])));
    }

    return this.http.get<unknown>(accessApi.sidebar(userId, orgId)).pipe(
      map((response: unknown) => {
        const sidebar = unwrapApiResponse<SidebarMenuNode[]>(response, unwrapApiList<SidebarMenuNode>(response));
        const items = (sidebar ?? []).map(node => this.mapSidebarNode(node));
        const normalized = this.normalizeMenuItems(items);
        const consolidated = this.isTenantManagerRole() ? normalized : this.consolidateWorkspaceMenu(normalized);
        const flattened = this.isTenantManagerRole() ? this.flattenGroupedMenus(consolidated) : consolidated;
        const filtered = this.applyNavigationRules(flattened);

        // Guardrail: if role filtering/grouping accidentally removes everything,
        // fall back to normalized server sidebar so users still get navigation.
        if (filtered.length === 0 && normalized.length > 0) {
          return normalized;
        }

        return filtered;
      }),
      tap(menus => {
        this.menuCache = menus;
        // NOTE: intentionally NOT caching to localStorage so refreshing the page
        // always gets the latest role-menu mapping from the backend.
      }),
      catchError(err => {
        this.logger.error('Failed to load side menus', err);
        return of([]);
      })
    );
  }


  private resolveSidebarOrganizationId(parsedUser: { id?: string | number; orgId?: string | number; organizationId?: string | number }): number {
    const candidates: Array<string | number | null | undefined> = [
      sessionStorage.getItem('currentOrgId'),
      localStorage.getItem('currentOrgId'),
      this.orgContext.resolveOrganizationId(),
      parsedUser?.organizationId,
      parsedUser?.orgId,
      environment.defaultOrganizationId
    ];

    for (const candidate of candidates) {
      if (candidate == null || candidate === '') {
        continue;
      }
      const orgId = Number(candidate);
      if (Number.isFinite(orgId) && orgId > 0) {
        return orgId;
      }
    }
    return 0;
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
    const isAccessManager = this.hasAnyRole(roles, ['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'ADMIN', 'COLLEGE_ADMIN', 'INSTITUTION_ADMIN']);

    let menus = this.normalizeTenantRoutes(items);

    if (!isFeatureEnabled('feeManagementEnabled')) {
      menus = this.filterNavigationItems(menus, item => this.isFeeManagementItem(item));
    }

    if (!isTenantManager) {
      menus = this.filterNavigationItems(menus, item => this.isTenantManagementItem(item));
    }

    menus = this.filterNavigationItems(menus, item => this.isOrganizationProfileItem(item));

    if (isTenantManager) {
      menus = this.filterNavigationItems(menus, item => this.isRedundantTenantMenuStub(item));
    }

    if (isAccessManager) {
      menus = this.ensureMenuGroup(menus, this.accessManagementMenuGroup());
    }

    return menus;
  }

  private mapSidebarNode(node: SidebarMenuNode): MenuItem {
    const route = node.route?.trim();
    let routerLink: MenuItem['routerLink'];
    if (route) {
      if (route.startsWith('/app') || route.startsWith('/auth') || route.startsWith('/public')) {
        routerLink = route;
      } else if (route.startsWith('app/')) {
        routerLink = `/${route}`;
      } else if (route.startsWith('/')) {
        routerLink = `/app${route}`;
      } else {
        routerLink = `/app/${route.replace(/^\/+/, '')}`;
      }
    }

    return {
      id: node.id != null ? String(node.id) : node.menuCode,
      title: node.menuCode,
      label: node.menuName,
      icon: node.icon,
      routerLink,
      items: node.children?.length ? node.children.map(child => this.mapSidebarNode(child)) : undefined
    };
  }

  /** Ensures MODULE group children with routes are direct clickable leaves (handles extra nesting from API). */
  private flattenGroupedMenus(items: MenuItem[]): MenuItem[] {
    return (items ?? []).map(item => this.flattenGroupNode(item));
  }

  private flattenGroupNode(item: MenuItem): MenuItem {
    if (!item.items?.length) {
      return item;
    }

    const flattenedChildren = item.items.flatMap(child => {
      if (this.routerLinkText(child.routerLink)) {
        return [{ ...child, items: undefined }];
      }
      if (child.items?.length) {
        return child.items.map(grandchild => ({
          ...grandchild,
          items: undefined,
          title: child.label ? `${child.label} / ${grandchild.label}` : grandchild.label
        }));
      }
      return [];
    });

    return {
      ...item,
      items: flattenedChildren.length
        ? flattenedChildren.map(child => this.flattenGroupNode(child))
        : undefined
    };
  }

  private accessManagementMenuGroup(): MenuItem {
    return {
      label: 'Access Management',
      icon: 'pi pi-lock',
      routerLink: ['/app/access-management/dashboard'],
      items: [
        { label: 'Dashboard', icon: 'pi pi-chart-line', routerLink: ['/app/access-management/dashboard'] },
        { label: 'Roles', icon: 'pi pi-user-edit', routerLink: ['/app/access-management/roles'] },
        { label: 'Menu Catalog', icon: 'pi pi-th-large', routerLink: ['/app/access-management/menus'] },
        { label: 'Users', icon: 'pi pi-users', routerLink: ['/app/access-management/users'] },
        { label: 'Security Policy', icon: 'pi pi-shield', routerLink: ['/app/access-management/security-policy'] },
        { label: 'Login History', icon: 'pi pi-history', routerLink: ['/app/access-management/login-history'] }
      ]
    };
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

  private isRedundantTenantMenuStub(item: MenuItem): boolean {
    const route = this.routerLinkText(item.routerLink).toLowerCase();
    const label = (item.label ?? '').toLowerCase();
    if (label !== 'tenant management') {
      return false;
    }
    return route === '/app/tenant-management' || route.endsWith('/tenant-management');
  }

  private isTenantManagementItem(item: MenuItem): boolean {
    const route = this.routerLinkText(item.routerLink).toLowerCase();
    const label = (item.label ?? '').toLowerCase();
    return route.includes('/app/tenant-management') || route.includes('/app/platform') || route.includes('/app/admin/organizations') || label.includes('tenant management') || label.includes('platform control center');
  }

  private isAccessManagementItem(item: MenuItem): boolean {
    const route = this.routerLinkText(item.routerLink).toLowerCase();
    const label = (item.label ?? '').toLowerCase();
    return route.includes('/app/access-management') || route.includes('/app/organization/access-control') || label.includes('access management') || label.includes('access control');
  }

  private isOrganizationProfileItem(item: MenuItem): boolean {
    const route = this.routerLinkText(item.routerLink).toLowerCase();
    return route.includes('/app/organization') || route.includes('/app/organization-profile');
  }

  private isFeeManagementItem(item: MenuItem): boolean {
    const route = this.routerLinkText(item.routerLink).toLowerCase();
    const label = (item.label ?? '').toLowerCase();
    const id = String(item.id ?? '').toLowerCase();
    return route.includes('/app/fees')
      || route.includes('/app/reports')
      || id.includes('fee')
      || label.includes('fee')
      || label.includes('finance')
      || label.includes('payment collection');
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
      const roleValues = [
        user.role,
        user.roleCode,
        user.roleName,
        user.roleType,
        ...(Array.isArray(user.roles) ? user.roles : [])
      ];
      return roleValues
        .flatMap((role: any) => {
          if (role && typeof role === 'object') {
            return [role.roleType, role.roleCode, role.roleName, role.name];
          }
          return [role];
        })
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

  private isTenantManagerRole(): boolean {
    return this.hasAnyRole(this.currentRoleTokens(), ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'THINKERSCAVE_INTERNAL', 'INTERNAL_TEAM']);
  }

  private normalizeRoleToken(role: string): string {
    return role.trim().replace(/^ROLE_/i, '').replace(/[\s-]+/g, '_').toUpperCase();
  }
}
