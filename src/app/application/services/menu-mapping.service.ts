import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { catchError, map, Observable, of, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrganizationContextService } from '../../core/services/organization-context.service';
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

    let parsedUser: any;
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
      return of([]);
    }

    return this.http.get<unknown>(accessApi.sidebar(userId, orgId)).pipe(
      map((response: unknown) => {
        const sidebar = unwrapApiResponse<SidebarMenuNode[]>(response, unwrapApiList<SidebarMenuNode>(response));
        const items = (sidebar ?? []).map(node => this.mapSidebarNode(node));
        const normalized = this.normalizeMenuItems(items);
        const flattened = this.flattenGroupedMenus(normalized);
        return this.applyNavigationRules(flattened);
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


  private resolveSidebarOrganizationId(parsedUser: any): number {
    const candidates: Array<string | number | null | undefined> = [
      sessionStorage.getItem('currentOrgId'),
      localStorage.getItem('currentOrgId'),
      this.orgContext.resolveOrganizationId(),
      parsedUser?.currentOrgId,
      parsedUser?.organizationId,
      parsedUser?.orgId,
      parsedUser?.organizations?.[0]?.organizationId,
      parsedUser?.organizations?.[0]?.orgId,
      parsedUser?.organizations?.[0]?.id,
      parsedUser?.organization?.organizationId,
      parsedUser?.organization?.orgId,
      parsedUser?.organization?.id,
      parsedUser?.data?.organizationId,
      parsedUser?.data?.orgId,
      parsedUser?.data?.organizations?.[0]?.orgId,
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
    try {
      localStorage.removeItem('sideMenu');
      sessionStorage.removeItem('sideMenu');
    } catch {
      /* ignore storage failures */
    }
  }

  refreshMenu(): void {
    this.clearMenuCache();
    this.menuRefreshSubject.next();
  }

  /** Sidebar trail for the current URL: parent group + matching leaf when present. */
  trailForUrl(url: string): { label: string; link: string[] | null }[] {
    const path = this.normalizePath(url);
    if (!path || !this.menuCache.length) {
      return [];
    }

    type Node = { item: MenuItem; ancestors: MenuItem[] };
    const nodes: Node[] = [];
    const walk = (items: MenuItem[] | undefined, ancestors: MenuItem[]): void => {
      for (const item of items ?? []) {
        nodes.push({ item, ancestors });
        if (item.items?.length) {
          walk(item.items, [...ancestors, item]);
        }
      }
    };
    walk(this.menuCache, []);

    let best: Node | null = null;
    let bestLen = -1;
    for (const node of nodes) {
      const link = this.normalizePath(this.routerLinkText(node.item.routerLink));
      if (!link) {
        continue;
      }
      if (path === link || path.startsWith(`${link}/`)) {
        if (link.length > bestLen) {
          best = node;
          bestLen = link.length;
        }
      }
    }

    if (!best) {
      const workspace = this.workspacePrefix(path);
      if (workspace) {
        const group = nodes.find(node =>
          (node.item.items ?? []).some(child => {
            const link = this.normalizePath(this.routerLinkText(child.routerLink));
            return link === workspace || link.startsWith(`${workspace}/`);
          })
        );
        if (group?.item.label) {
          const groupLink = this.normalizePath(this.routerLinkText(group.item.routerLink))
            || this.firstChildLink(group.item);
          return [{ label: group.item.label, link: groupLink ? [groupLink] : null }];
        }
      }
      return [];
    }

    return [...best.ancestors, best.item]
      .filter(item => !!item.label)
      .map(item => {
        const link = this.normalizePath(this.routerLinkText(item.routerLink));
        return { label: item.label as string, link: link ? [link] : null };
      });
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

  private applyNavigationRules(items: MenuItem[]): MenuItem[] {
    return items;
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

  private routerLinkText(routerLink: MenuItem['routerLink']): string {
    if (!routerLink) {
      return '';
    }
    return Array.isArray(routerLink) ? routerLink.join('/') : String(routerLink);
  }

  private normalizePath(url: string): string {
    const path = (url || '').split('?')[0].split('#')[0].trim();
    if (!path) {
      return '';
    }
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
  }

  private workspacePrefix(path: string): string {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'app') {
      return `/app/${parts[1]}`;
    }
    return '';
  }

  private firstChildLink(item: MenuItem): string {
    for (const child of item.items ?? []) {
      const link = this.normalizePath(this.routerLinkText(child.routerLink));
      if (link) {
        return link;
      }
    }
    return '';
  }

}

