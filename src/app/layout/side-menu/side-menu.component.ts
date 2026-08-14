import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostBinding, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { distinctUntilChanged, filter, skip } from 'rxjs';
import { BreadCrumbService } from '../../core/services/bread-crumb.service';
import { SidebarLayoutService } from '../../core/services/sidebar-layout.service';
import { PermissionService } from '../../core/services/permission.service';
import { LoginService } from '../../core/services/login.service';
import { LoggerService } from '../../core/services/logger.service';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { LanguageService } from '../../core/services/language.service';
import { normalizePrimeIcon } from '../../shared/utils/prime-icon.util';
import { TcTranslatePipe } from '../../shared/pipes/tc-translate.pipe';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TcTranslatePipe],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent implements OnInit {
  /** When true, sidebar stays expanded (tablet pin / legacy). */
  @Input() expanded = false;

  items: MenuItem[] = [];
  loading = true;
  openGroups = new Set<string>();

  private readonly sideMenuService = inject(MenuMappingService);
  private readonly permissionService = inject(PermissionService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly breadcrumbService = inject(BreadCrumbService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly sidebarLayout = inject(SidebarLayoutService);
  private readonly logger = inject(LoggerService);
  private readonly languageService = inject(LanguageService);

  private activeLeafKey: string | null = null;
  private collapseHoverTimer: ReturnType<typeof setTimeout> | null = null;
  private suppressPointerClickUntil = 0;

  get displayExpanded(): boolean {
    return this.expanded || this.sidebarLayout.displayExpanded();
  }

  @HostBinding('class.is-expanded')
  get hostExpanded(): boolean {
    return this.expanded || this.sidebarLayout.isTabletPinned() || this.sidebarLayout.isMobileDrawerOpen();
  }

  @HostBinding('class.is-hover-expanded')
  get isHoverExpanded(): boolean {
    return this.sidebarLayout.displayExpanded() && !this.expanded && !this.sidebarLayout.isMobileDrawerOpen();
  }

  @HostBinding('class.is-mobile-drawer')
  get isMobileDrawer(): boolean {
    return this.sidebarLayout.isMobileDrawerOpen();
  }

  @HostBinding('class.is-tablet-pinned')
  get isTabletPinned(): boolean {
    return this.sidebarLayout.isTabletPinned();
  }

  get showOverlayBackdrop(): boolean {
    return this.isMobileDrawer || this.isTabletPinned;
  }

  ngOnInit(): void {
    this.reloadSidebar();

    this.sideMenuService.menuRefresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadSidebar());

    this.loginService.currentOrgId$
      .pipe(distinctUntilChanged(), skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.sideMenuService.clearMenuCache();
        this.permissionService.clearPermissions();
        this.reloadSidebar();
      });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.syncActiveState();
      this.openActiveGroups();
      this.cdr.markForCheck();
    });
  }

  private reloadSidebar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.permissionService.loadPermissions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.sideMenuService.loadMenu().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (menus) => {
        this.items = this.normalizeItems(menus);
        this.loading = false;
        this.syncActiveState();
        this.openActiveGroups();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.logger.error('Error loading menu', err);
        this.items = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSidebarEnter(): void {
    if (this.collapseHoverTimer) {
      clearTimeout(this.collapseHoverTimer);
      this.collapseHoverTimer = null;
    }
    this.sidebarLayout.setHovered(true);
    if (this.openGroups.size === 0) {
      this.openActiveGroups();
    }
    this.cdr.markForCheck();
  }

  onSidebarLeave(): void {
    if (this.collapseHoverTimer) {
      clearTimeout(this.collapseHoverTimer);
    }
    this.collapseHoverTimer = setTimeout(() => {
      this.collapseHoverExpandedSidebar();
    }, 280);
  }

  expandFromFocus(): void {
    this.sidebarLayout.setHovered(true);
    this.openActiveGroups();
    this.cdr.markForCheck();
  }

  collapseFromFocus(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.elementRef.nativeElement.contains(nextTarget)) {
      return;
    }
    setTimeout(() => {
      const active = typeof document !== 'undefined' ? document.activeElement : null;
      if (active && this.elementRef.nativeElement.contains(active)) {
        return;
      }
      this.collapseHoverExpandedSidebar();
    }, 0);
  }

  private collapseHoverExpandedSidebar(): void {
    if (!this.shouldAutoCollapseSidebar()) {
      return;
    }

    // Keep hover-collapse deterministic: close transient groups before collapsing.
    this.openGroups.clear();
    this.sidebarLayout.setHovered(false);
    this.cdr.markForCheck();
  }

  private shouldAutoCollapseSidebar(): boolean {
    return !this.expanded && !this.sidebarLayout.isMobileDrawerOpen() && !this.sidebarLayout.isTabletPinned();
  }

  closeMobileDrawer(): void {
    this.sidebarLayout.closeMobileDrawer();
    this.cdr.markForCheck();
  }

  tooltipFor(item: MenuItem): string {
    return item.label ?? '';
  }

  showTooltip(): boolean {
    return !this.displayExpanded;
  }

  private openActiveGroups(): void {
    this.openGroups.clear();
    if (!this.displayExpanded) {
      return;
    }

    const parent = this.findActiveParent();
    if (parent) {
      this.openGroups.add(this.getItemKey(parent));
    }
  }

  isLeafActive(item: MenuItem): boolean {
    return !this.hasChildren(item) && this.getItemKey(item) === this.activeLeafKey;
  }

  isParentActive(item: MenuItem): boolean {
    if (!this.hasChildren(item) || !this.activeLeafKey) {
      return false;
    }
    return item.items?.some(child =>
      this.getItemKey(child) === this.activeLeafKey
      || (child.items?.some(grandchild => this.getItemKey(grandchild) === this.activeLeafKey) ?? false)
    ) ?? false;
  }

  private syncActiveState(): void {
    this.activeLeafKey = this.resolveDeepestActiveLeafKey(this.items);
  }

  private resolveDeepestActiveLeafKey(items: MenuItem[]): string | null {
    const current = this.currentPath();
    let bestKey: string | null = null;
    let bestScore = -1;

    const visit = (nodes: MenuItem[]): void => {
      for (const node of nodes) {
        if (this.hasChildren(node)) {
          visit(node.items ?? []);
          continue;
        }

        const path = this.itemPath(node);
        if (!path || !this.pathMatches(current, path, this.isExact(node))) {
          continue;
        }

        const score = path.length;
        const key = this.getItemKey(node);
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }
    };

    visit(items);
    return bestKey;
  }

  private findActiveParent(): MenuItem | null {
    if (!this.activeLeafKey) {
      return null;
    }

    for (const item of this.items) {
      if (this.hasChildren(item) && item.items?.some(child =>
        this.getItemKey(child) === this.activeLeafKey
        || (child.items?.some(grandchild => this.getItemKey(grandchild) === this.activeLeafKey) ?? false)
      )) {
        return item;
      }
    }
    return null;
  }

  private currentPath(): string {
    const url = this.router.url.split('?')[0].split('#')[0];
    if (url.length > 1 && url.endsWith('/')) {
      return url.slice(0, -1);
    }
    return url;
  }

  private itemPath(item: MenuItem): string {
    const link = this.getRouterLink(item);
    if (!link) {
      return '';
    }

    if (Array.isArray(link)) {
      return '/' + link.map(segment => String(segment).replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
    }

    const text = String(link).trim();
    return text.startsWith('/') ? text : `/${text}`;
  }

  private pathMatches(current: string, path: string, exact: boolean): boolean {
    if (exact) {
      return current === path;
    }
    return current === path || current.startsWith(`${path}/`);
  }

  private normalizeItems(items: MenuItem[]): MenuItem[] {
    return (items ?? []).map(item => ({
      ...item,
      icon: normalizePrimeIcon(item.icon, 'pi pi-circle'),
      items: item.items ? this.normalizeItems(item.items) : undefined
    }));
  }

  hasChildren(item: MenuItem): boolean {
    return !!item.items?.length;
  }

  translateMenu(label: string | undefined): string {
    // Touch language + catalog version so OnPush refreshes when locale/dicts change.
    this.languageService.language();
    this.languageService.catalogVersion();
    return this.languageService.menuLabel(label);
  }

  getItemKey(item: MenuItem): string {
    if (item.id != null) {
      return String(item.id);
    }
    const link = this.routerLinkText(item.routerLink);
    return link || item.label || 'menu-item';
  }

  private routerLinkText(routerLink: MenuItem['routerLink']): string {
    if (!routerLink) {
      return '';
    }
    return Array.isArray(routerLink) ? routerLink.join('/') : String(routerLink);
  }

  isGroupOpen(item: MenuItem): boolean {
    return this.openGroups.has(this.getItemKey(item));
  }

  toggleGroup(item: MenuItem): void {
    if (!this.displayExpanded) {
      this.sidebarLayout.setHovered(true);
    }

    const key = this.getItemKey(item);
    if (this.openGroups.has(key)) {
      this.openGroups.delete(key);
      return;
    }

    this.openGroups.clear();
    this.openGroups.add(key);
  }

  onGroupPointerDown(item: MenuItem, event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.markPointerHandled();
    event.preventDefault();
    event.stopPropagation();
    this.toggleGroup(item);
  }

  onGroupClick(item: MenuItem, event: MouseEvent): void {
    if (this.shouldSuppressPointerClick(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.toggleGroup(item);
  }

  onItemPointerDown(parent: MenuItem | null, item: MenuItem, event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.markPointerHandled();
    this.selectItem(parent, item, event);
  }

  onItemClick(parent: MenuItem | null, item: MenuItem, event: MouseEvent): void {
    if (this.shouldSuppressPointerClick(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.selectItem(parent, item, event);
  }

  private markPointerHandled(): void {
    this.suppressPointerClickUntil = Date.now() + 400;
  }

  private shouldSuppressPointerClick(event: MouseEvent): boolean {
    // Keep keyboard-triggered click events working (detail === 0).
    if (event.detail === 0) {
      return false;
    }
    return Date.now() <= this.suppressPointerClickUntil;
  }

  selectItem(parent: MenuItem | null, item: MenuItem, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const targetUrl = this.resolveNavigableUrl(item);
    if (!targetUrl) {
      return;
    }

    this.breadcrumbService.setBreadcrumb(parent?.label ?? item.label ?? '', parent ? item.label ?? '' : '');

    if (parent) {
      this.openGroups.add(this.getItemKey(parent));
    }

    this.sidebarLayout.setHovered(true);
    const closeDrawer = this.sidebarLayout.isMobileDrawerOpen() || this.sidebarLayout.isTabletPinned();

    void this.router.navigateByUrl(targetUrl).then(() => {
      this.syncActiveState();
      this.openActiveGroups();
      if (closeDrawer) {
        this.closeMobileDrawer();
      }
      this.cdr.markForCheck();
    });
  }

  getRouterLink(item: MenuItem): string | any[] | null {
    if (item.routerLink) {
      return item.routerLink as string | any[];
    }
    if (item.url) {
      return item.url as string;
    }
    return null;
  }

  resolveNavigableUrl(item: MenuItem): string | null {
    const direct = this.itemPath(item);
    if (direct) {
      return direct;
    }

    for (const child of item.items ?? []) {
      const nested = this.resolveNavigableUrl(child);
      if (nested) {
        return nested;
      }
    }

    return null;
  }
  isExact(item: MenuItem): boolean {
    const link = this.getRouterLink(item);
    if (!link) return false;
    const path = Array.isArray(link) ? link.join('/') : link;
    return path === '/app' || path === 'app' || path === '/app/';
  }
}
