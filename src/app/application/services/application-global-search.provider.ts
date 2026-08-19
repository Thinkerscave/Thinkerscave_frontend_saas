import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { dashboardApi } from '../../shared/constants/api.endpoint';
import { GlobalSearchProvider, GlobalSearchResult } from '../../shared/components/global-search/global-search.provider';
import { unwrapApiResponse } from '../../shared/utils/api-response.util';
import { MenuMappingService } from './menu-mapping.service';
import { isFeatureEnabled } from '../../core/config/feature-flags';
import { LoginService } from '../../core/services/login.service';
import {
  GlobalSearchScope,
  resolveGlobalSearchScope,
  roleTokensFromUser
} from '../../core/utils/workspace-home';
import { PlatformManagementService } from '../tenant-management/services/platform-management.service';
import { AccessManagementService } from '../access-management/services/access-management.service';
import { AccessMenu } from '../access-management/models/access.model';
import { CustomerListItem, OrganizationSummary, SpringPage } from '../tenant-management/models/platform.model';
import { normalizePrimeIcon } from '../../shared/utils/prime-icon.util';

interface DashboardSearchResponse {
  query: string;
  results: DashboardSearchRecord[];
  supportedCategories: string[];
}

interface DashboardSearchRecord {
  key: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string | null;
  detail?: string | null;
  icon?: string | null;
  route?: string | null;
  tone?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable({ providedIn: 'root' })
export class ApplicationGlobalSearchProvider extends GlobalSearchProvider {
  constructor(
    private readonly http: HttpClient,
    private readonly menuMappingService: MenuMappingService,
    private readonly loginService: LoginService,
    private readonly platformApi: PlatformManagementService,
    private readonly accessApi: AccessManagementService
  ) {
    super();
  }

  override search(term: string): Observable<GlobalSearchResult[]> {
    const query = term.trim();
    const scope = resolveGlobalSearchScope(
      roleTokensFromUser(this.loginService.getUser()),
      this.loginService.getLoginContext() === 'PLATFORM'
    );
    if (query.length < 2 || scope === 'hidden') {
      return of([]);
    }
    if (scope === 'platform') {
      return this.searchPlatform(query);
    }
    return this.searchTenant(query, scope);
  }

  private searchPlatform(query: string): Observable<GlobalSearchResult[]> {
    return forkJoin({
      customers: this.platformApi.getCustomers({ search: query, size: 8, page: 0 }).pipe(
        catchError(() => of(this.emptyPage<CustomerListItem>()))
      ),
      organizations: this.platformApi.getOrganizations({ search: query, size: 8, page: 0 }).pipe(
        catchError(() => of(this.emptyPage<OrganizationSummary>()))
      ),
      menus: this.accessApi.getMenuTree(true).pipe(catchError(() => of([] as AccessMenu[])))
    }).pipe(
      map(({ customers, organizations, menus }) => this.dedupe([
        ...this.mapCustomers(customers.content ?? []),
        ...this.mapOrganizations(organizations.content ?? []),
        ...this.mapMenus(this.flattenAccessMenus(menus), query)
      ]))
    );
  }

  private searchTenant(query: string, scope: GlobalSearchScope): Observable<GlobalSearchResult[]> {
    const records$ = this.searchRecords(query).pipe(catchError(() => of([])));
    const navigation$ = scope === 'teacher'
      ? of([] as GlobalSearchResult[])
      : this.searchNavigation(query).pipe(catchError(() => of([] as GlobalSearchResult[])));

    return forkJoin({ navigation: navigation$, records: records$ }).pipe(
      map(({ navigation, records }) => this.dedupe([...records, ...navigation]))
    );
  }

  private searchRecords(query: string): Observable<GlobalSearchResult[]> {
    return this.http.get<DashboardSearchResponse | { data: DashboardSearchResponse }>(dashboardApi.search, {
      params: { query }
    }).pipe(
      map(response => unwrapApiResponse<DashboardSearchResponse>(response, { query, results: [], supportedCategories: [] })),
      map(payload => (payload.results ?? []).map(result => this.mapRecordResult(result)))
    );
  }

  private searchNavigation(query: string): Observable<GlobalSearchResult[]> {
    const normalizedQuery = query.toLowerCase();
    return this.menuMappingService.loadMenu().pipe(
      map(items => this.flattenMenu(items)
        .filter(item => item.label.toLowerCase().includes(normalizedQuery)
          || item.description?.toLowerCase().includes(normalizedQuery))
        .slice(0, 12)
        .map(item => ({
          id: `nav-${item.path.join('-')}`,
          label: item.label,
          description: item.description || item.path.slice(0, -1).join(' / ') || 'Open page',
          icon: item.icon || 'pi pi-compass',
          category: 'Pages',
          link: item.routerLink,
          payload: item
        } satisfies GlobalSearchResult)))
    );
  }

  private mapCustomers(items: CustomerListItem[]): GlobalSearchResult[] {
    return items.map(item => ({
      id: `customer-${item.id}`,
      label: item.customerName,
      description: [item.customerCode, item.ownerEmail || item.ownerName].filter(Boolean).join(' · '),
      icon: 'pi pi-briefcase',
      category: 'Customers',
      link: `/app/tenant-management/customers/${item.id}`
    }));
  }

  private mapOrganizations(items: OrganizationSummary[]): GlobalSearchResult[] {
    return items.map(item => ({
      id: `organization-${item.id}`,
      label: item.organizationName,
      description: [item.organizationCode, item.status, item.customerName].filter(Boolean).join(' · '),
      icon: 'pi pi-building',
      category: 'Organizations',
      link: `/app/tenant-management/organizations/${item.id}`
    }));
  }

  private mapMenus(menus: AccessMenu[], query: string): GlobalSearchResult[] {
    const q = query.toLowerCase();
    return menus
      .filter(menu => {
        const haystack = [menu.menuName, menu.menuCode, menu.route, menu.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .filter(menu => !!menu.route)
      .slice(0, 12)
      .map(menu => ({
        id: `menu-${menu.id}`,
        label: menu.menuName,
        description: [menu.menuCode, menu.description || menu.route].filter(Boolean).join(' · '),
        icon: normalizePrimeIcon(menu.icon || 'pi pi-sitemap'),
        category: 'Menus',
        link: menu.route
      }));
  }

  private flattenAccessMenus(menus: AccessMenu[]): AccessMenu[] {
    return (menus ?? []).flatMap(menu => [menu, ...this.flattenAccessMenus(menu.children ?? [])]);
  }

  private mapRecordResult(result: DashboardSearchRecord): GlobalSearchResult {
    return {
      id: result.key,
      label: result.title,
      description: [result.subtitle, result.detail].filter(Boolean).join(' · '),
      icon: result.icon || this.iconForCategory(result.entityType),
      category: this.categoryLabel(result.entityType),
      link: result.route || undefined,
      payload: result
    };
  }

  private dedupe(results: GlobalSearchResult[]): GlobalSearchResult[] {
    const seen = new Set<string>();
    return results
      .filter(result => !this.isDisabledFeatureResult(result))
      .filter(result => {
        const key = `${result.category}:${result.link ?? result.id}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 40);
  }

  private isDisabledFeatureResult(result: GlobalSearchResult): boolean {
    if (isFeatureEnabled('feeManagementEnabled')) {
      return false;
    }
    const link = String(result.link ?? '').toLowerCase();
    const category = String(result.category ?? '').toLowerCase();
    const label = String(result.label ?? '').toLowerCase();
    return link.includes('/app/fees')
      || link.includes('/app/reports')
      || category.includes('fee')
      || label.includes('fee');
  }

  private flattenMenu(items: MenuItem[], parents: string[] = []): Array<{
    label: string;
    description?: string;
    icon?: string;
    routerLink?: string | any[];
    path: string[];
  }> {
    return (items ?? []).flatMap(item => {
      const path = [...parents, item.label ?? 'Menu'];
      const link = this.asRouterLink(item.routerLink);
      const current = link ? [{
        label: item.label ?? 'Menu item',
        description: item.title || item.tooltip || item['description'],
        icon: item.icon,
        routerLink: link,
        path
      }] : [];
      return [...current, ...this.flattenMenu(item.items ?? [], path)];
    });
  }

  private asRouterLink(routerLink: MenuItem['routerLink']): string | any[] | undefined {
    if (typeof routerLink === 'string' || Array.isArray(routerLink)) {
      return routerLink;
    }
    return undefined;
  }

  private emptyPage<T>(): SpringPage<T> {
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  }

  private categoryLabel(entityType: string): string {
    const normalized = entityType?.trim();
    if (!normalized) return 'Records';
    const key = normalized.toLowerCase();
    if (key === 'menu') return 'Menus';
    if (key === 'class') return 'Classes';
    if (key === 'parent') return 'Parents';
    if (key === 'staff') return 'Staff';
    return normalized.endsWith('s') ? normalized : `${normalized}s`;
  }

  private iconForCategory(entityType: string): string {
    const normalized = entityType?.toLowerCase();
    if (normalized === 'student') return 'pi pi-user';
    if (normalized === 'staff') return 'pi pi-briefcase';
    if (normalized === 'customer') return 'pi pi-briefcase';
    if (normalized === 'organization') return 'pi pi-building';
    if (normalized === 'menu') return 'pi pi-sitemap';
    if (normalized === 'class') return 'pi pi-th-large';
    if (normalized === 'lead') return 'pi pi-user-plus';
    return 'pi pi-search';
  }
}
