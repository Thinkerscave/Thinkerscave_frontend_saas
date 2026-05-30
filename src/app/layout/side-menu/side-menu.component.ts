import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject , ChangeDetectionStrategy} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { BreadCrumbService } from '../../core/services/bread-crumb.service';
import { normalizePrimeIcon } from '../../shared/utils/prime-icon.util';

@Component({
  selector: 'app-side-menu',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent implements OnInit {
  items: MenuItem[] = [];
  loading = true;
  @Input() expanded = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly openGroups = new Set<string>();

  constructor(private sideMenuService: MenuMappingService,
    private breadcrumbService: BreadCrumbService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMenu();

    this.sideMenuService.menuRefresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadMenu());
  }

  private loadMenu(): void {
    this.loading = true;
    this.sideMenuService.loadMenu().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (menus) => {
        this.items = this.normalizeItems(menus);
        this.syncActiveGroups();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading menu:', err);
        this.items = [];
        this.loading = false;
      }
    });
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

  isExact(item: MenuItem): boolean {
    const link = this.getRouterLink(item);
    const path = Array.isArray(link) ? link.join('/') : link;
    return path === '/app' || path === 'app' || path === '/app/';
  }

  getRouterLink(item: MenuItem): string | any[] | null {
    return item.routerLink as string | any[] | null;
  }

  private normalizeItems(items: MenuItem[]): MenuItem[] {
    return (items ?? []).map(item => ({
      ...item,
      icon: normalizePrimeIcon(item.icon, 'pi pi-circle'),
      items: item.items ? this.normalizeItems(item.items) : undefined
    }));
  }

  private syncActiveGroups(): void {
    this.items.forEach(item => {
      if (this.hasChildren(item) && this.isMenuActive(item)) {
        this.openGroups.add(this.getItemKey(item));
      }
    });
  }

}
