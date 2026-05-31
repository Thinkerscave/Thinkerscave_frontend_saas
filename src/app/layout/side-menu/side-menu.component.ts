import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostBinding, inject, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs';
import { BreadCrumbService } from '../../core/services/bread-crumb.service';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { normalizePrimeIcon } from '../../shared/utils/prime-icon.util';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent implements OnInit {
  @Input() expanded = true;

  items: MenuItem[] = [];
  loading = true;
  openGroups = new Set<string>();
  hovered = false;

  private sideMenuService = inject(MenuMappingService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private breadcrumbService = inject(BreadCrumbService);

  get displayExpanded(): boolean {
    return this.expanded || this.hovered;
  }

  @HostBinding('class.is-hover-expanded')
  get isHoverExpanded(): boolean {
    return this.hovered && !this.expanded;
  }

  ngOnInit() {
    this.sideMenuService.loadMenu().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (menus) => {
        this.items = this.normalizeItems(menus);
        this.loading = false;
        
        setTimeout(() => this.openActiveGroup(), 100);
      },
      error: (err) => {
        console.error('Error loading menu:', err);
        this.items = [];
        this.loading = false;
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {});
  }

  private openActiveGroup() {
    for (const item of this.items) {
      if (this.hasChildren(item) && this.isMenuActive(item)) {
        this.openGroups.add(this.getItemKey(item));
      }
    }
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

  getItemKey(item: MenuItem): string {
    return item.label ?? item.routerLink?.toString() ?? 'menu-item';
  }

  isGroupOpen(item: MenuItem): boolean {
    return this.openGroups.has(this.getItemKey(item));
  }

  toggleGroup(item: MenuItem): void {
    if (!this.displayExpanded) {
      const routerLink = this.getRouterLink(item);
      if (routerLink) {
        const commands = Array.isArray(routerLink) ? routerLink : [routerLink];
        void this.router.navigate(commands, { queryParams: item.queryParams });
      }
      return;
    }

    const key = this.getItemKey(item);
    if (this.openGroups.has(key)) {
      this.openGroups.delete(key);
      return;
    }

    this.openGroups.clear();
    this.openGroups.add(key);
  }

  selectItem(parent: MenuItem | null, item: MenuItem): void {
    this.breadcrumbService.setBreadcrumb(parent?.label ?? item.label ?? '', parent ? item.label ?? '' : '');
  }

  isMenuActive(item: MenuItem): boolean {
    if (this.hasChildren(item)) {
      return item.items?.some(child => this.isMenuActive(child)) ?? false;
    }

    const routerLink = this.getRouterLink(item);
    if (!routerLink) {
      return false;
    }

    const commands = Array.isArray(routerLink) ? routerLink : [routerLink];
    return this.router.isActive(this.router.createUrlTree(commands, { queryParams: item.queryParams }), {
      paths: this.isExact(item) ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  getRouterLink(item: MenuItem): string | any[] | null {
    if (item.routerLink) return item.routerLink as string | any[];
    if (item.url) return item.url as string;
    return null;
  }

  isExact(item: MenuItem): boolean {
    const link = this.getRouterLink(item);
    if (!link) return false;
    const path = Array.isArray(link) ? link.join('/') : link;
    return path === '/app' || path === 'app' || path === '/app/';
  }
}
