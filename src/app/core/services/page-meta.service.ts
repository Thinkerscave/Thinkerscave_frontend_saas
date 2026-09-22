import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { AppPageHeader } from './bread-crumb.service';

export type PageKind = 'main' | 'detail';

export interface ResolvedCrumb {
  label: string;
  link: string[] | null;
}

export interface ResolvedPageMeta {
  title: string;
  subtitle: string | null;
  crumbs: ResolvedCrumb[];
  pageKind: PageKind | null;
  showBack: boolean;
  hideBack: boolean;
  backFallback: string | string[] | null;
}

@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly router = inject(Router);
  private readonly menus = inject(MenuMappingService);

  resolve(override: AppPageHeader | null, hasPrevious: boolean): ResolvedPageMeta {
    const route = this.collectRouteMeta();
    const menuCrumbs = this.menus.trailForUrl(this.router.url);
    const crumbs = this.mergeCrumbs(menuCrumbs, route.crumbs, override);

    const title = this.resolveTitle(route.pageTitle, crumbs, override, route.pageKind);
    const subtitle = override?.subtitle ?? route.pageSubtitle ?? null;

    const items = crumbs.map((crumb, index) => {
      const isLast = index === crumbs.length - 1;
      if (isLast || !crumb.link) {
        return { label: crumb.label, link: null };
      }
      return { label: crumb.label, link: crumb.link };
    });

    return {
      title,
      subtitle,
      crumbs: items,
      pageKind: route.pageKind,
      hideBack: route.hideBack || route.pageKind === 'main',
      showBack: this.resolveShowBack(route, hasPrevious),
      backFallback: route.backFallback
    };
  }

  private resolveTitle(
    pageTitle: string | null,
    crumbs: ResolvedCrumb[],
    override: AppPageHeader | null,
    pageKind: PageKind | null
  ): string {
    const fromRoute = pageTitle ?? crumbs.at(-1)?.label ?? 'Dashboard';
    if (pageKind === 'main' || pageKind === 'detail') {
      return fromRoute;
    }
    return override?.title ?? fromRoute;
  }

  private resolveShowBack(
    route: {
      pageKind: PageKind | null;
      showBack: boolean;
      hideBack: boolean;
      backFallback: string | string[] | null;
    },
    hasPrevious: boolean
  ): boolean {
    if (route.hideBack) {
      return false;
    }
    if (route.showBack) {
      return true;
    }
    if (route.pageKind === 'main') {
      return false;
    }
    if (route.pageKind === 'detail') {
      return true;
    }
    return hasPrevious || !!route.backFallback;
  }

  private collectRouteMeta(): {
    crumbs: ResolvedCrumb[];
    pageTitle: string | null;
    pageSubtitle: string | null;
    pageKind: PageKind | null;
    showBack: boolean;
    hideBack: boolean;
    backFallback: string | string[] | null;
  } {
    const crumbs: ResolvedCrumb[] = [];
    const pathParts: string[] = [];
    let pageTitle: string | null = null;
    let pageSubtitle: string | null = null;
    let pageKind: PageKind | null = null;
    let showBack = false;
    let hideBack = false;
    let backFallback: string | string[] | null = null;

    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
      const snap = route.snapshot;
      pathParts.push(...snap.url.map(segment => segment.path));

      const label = snap.data['breadcrumb'] as string | undefined;
      if (label) {
        const explicitLink = snap.data['breadcrumbLink'] as string[] | undefined;
        crumbs.push({
          label,
          link: explicitLink ?? this.pathLink(pathParts)
        });
      }

      if (typeof snap.data['pageSubtitle'] === 'string') {
        pageSubtitle = snap.data['pageSubtitle'];
      }
      if (typeof snap.data['pageTitle'] === 'string') {
        pageTitle = snap.data['pageTitle'];
      }
      if (snap.data['pageKind'] === 'main' || snap.data['pageKind'] === 'detail') {
        pageKind = snap.data['pageKind'];
      }
      if (snap.data['showBack'] === true) {
        showBack = true;
      }
      if (snap.data['hideBack'] === true) {
        hideBack = true;
      }
      if (snap.data['backFallback']) {
        backFallback = snap.data['backFallback'] as string | string[];
      }
    }

    if (crumbs.length) {
      crumbs[crumbs.length - 1].link = null;
    }

    if (!crumbs.length) {
      crumbs.push(...this.urlFallbackCrumbs());
    }

    return { crumbs, pageTitle, pageSubtitle, pageKind, showBack, hideBack, backFallback };
  }

  private mergeCrumbs(
    menu: ResolvedCrumb[],
    route: ResolvedCrumb[],
    override: AppPageHeader | null
  ): ResolvedCrumb[] {
    if (override?.crumbs?.length) {
      return override.crumbs.map((crumb, index, all) => ({
        label: crumb.label,
        link: index === all.length - 1 ? null : (crumb.link ?? null)
      }));
    }

    const current = this.pathOnly(this.router.url);
    const lastMenuPath = this.pathOnly((menu.at(-1)?.link ?? []).join('/') || '');
    const menuCoversPage = !!lastMenuPath && current === lastMenuPath;

    const out: ResolvedCrumb[] = [];
    const seen = new Set<string>();
    const add = (crumb: ResolvedCrumb) => {
      const key = crumb.label.trim().toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      out.push({ ...crumb });
    };

    menu.forEach(add);
    if (!menuCoversPage) {
      route.forEach(add);
    }

    if (out.length) {
      out[out.length - 1].link = null;
    }
    return out;
  }

  private pathOnly(url: string): string {
    return (url || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  }

  private urlFallbackCrumbs(): ResolvedCrumb[] {
    const segments = this.router.url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    if (!segments.length || (segments[0] === 'app' && segments.length === 1)) {
      return [{ label: 'Dashboard', link: null }];
    }
    if (segments[0] !== 'app') {
      return [{ label: this.titleCase(segments[0]), link: null }];
    }
    const labels = segments.slice(1).filter(seg => !/^\d+$/.test(seg));
    if (!labels.length) {
      return [{ label: 'Dashboard', link: null }];
    }
    return labels.map((seg, index) => ({
      label: this.titleCase(seg),
      link: index === labels.length - 1 ? null : ['/app/' + labels.slice(0, index + 1).join('/')]
    }));
  }

  private pathLink(pathParts: string[]): string[] {
    return ['/' + pathParts.filter(Boolean).join('/')];
  }

  private titleCase(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
