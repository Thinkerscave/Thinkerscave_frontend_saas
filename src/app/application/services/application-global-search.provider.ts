import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { dashboardApi } from '../../shared/constants/api.endpoint';
import { GlobalSearchProvider, GlobalSearchResult } from '../../shared/components/global-search/global-search.provider';
import { unwrapApiResponse } from '../../shared/utils/api-response.util';
import { MenuMappingService } from './menu-mapping.service';
import { isFeatureEnabled } from '../../core/config/feature-flags';

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
    private readonly menuMappingService: MenuMappingService
  ) {
    super();
  }

  override search(term: string): Observable<GlobalSearchResult[]> {
    const query = term.trim();
    if (query.length < 2) {
      return of([]);
    }

    return forkJoin({
      navigation: this.searchNavigation(query).pipe(catchError(() => of([]))),
      records: this.searchRecords(query).pipe(catchError(() => of([])))
    }).pipe(
      map(({ navigation, records }) =>
        [...navigation, ...records]
          .filter(result => !this.isDisabledFeatureResult(result))
          .slice(0, 40)
      )
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
        .filter(item => item.label.toLowerCase().includes(normalizedQuery) || item.description?.toLowerCase().includes(normalizedQuery))
        .slice(0, 12)
        .map(item => ({
          id: `nav-${item.path.join('-')}`,
          label: item.label,
          description: item.description || item.path.slice(0, -1).join(' / ') || 'Open workspace',
          icon: item.icon || 'pi pi-compass',
          category: 'Navigation',
          link: item.routerLink,
          payload: item
        } satisfies GlobalSearchResult)))
    );
  }

  private mapRecordResult(result: DashboardSearchRecord): GlobalSearchResult {
    return {
      id: result.key,
      label: result.title,
      description: [result.subtitle, result.detail].filter(Boolean).join(' - '),
      icon: result.icon || this.iconForCategory(result.entityType),
      category: this.categoryLabel(result.entityType),
      link: result.route || undefined,
      payload: result
    };
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

  private categoryLabel(entityType: string): string {
    const normalized = entityType?.trim();
    if (!normalized) {
      return 'Records';
    }

    if (normalized.toLowerCase() === 'parent') {
      return 'Parents';
    }

    return normalized.endsWith('s') ? normalized : `${normalized}s`;
  }

  private iconForCategory(entityType: string): string {
    const normalized = entityType?.toLowerCase();
    if (normalized === 'student') return 'pi pi-user';
    if (normalized === 'staff') return 'pi pi-briefcase';
    if (normalized === 'parent') return 'pi pi-address-book';
    if (normalized === 'invoice') return 'pi pi-wallet';
    if (normalized === 'class') return 'pi pi-building';
    if (normalized === 'attendance') return 'pi pi-calendar-check';
    return 'pi pi-search';
  }
}