import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AccessMenu } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  SaasPageHeaderComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPageChangeEvent, slicePage } from '../../../../shared/utils/paged-result.util';
import { normalizePrimeIcon } from '../../../../shared/utils/prime-icon.util';

interface MenuCatalogGroup {
  key: string;
  title: string;
  code: string;
  description: string;
  icon: string;
  scope: string;
  menus: AccessMenu[];
  menuCount: number;
  submenuCount: number;
}

@Component({
  selector: 'app-menu-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    AppListToolbarComponent,
    AppPaginatorComponent
  ],
  templateUrl: './menu-catalog.component.html',
  styleUrl: './menu-catalog.component.scss'
})
export class MenuCatalogComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage = '';
  selectedKey: string | null = null;
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly pageSizeOptions = UI_PAGINATION.options;

  readonly search = signal('');
  readonly appliedSearch = signal('');
  readonly viewMode = signal<AppListViewMode>('grid');
  readonly groups = signal<MenuCatalogGroup[]>([]);

  ngOnInit(): void {
    this.load();
  }

  readonly stats = computed<SaasStat[]>(() => {
    const list = this.groups();
    const menus = list.reduce((sum, group) => sum + group.menuCount, 0);
    const submenus = list.reduce((sum, group) => sum + group.submenuCount, 0);
    return [
      { key: 'features', label: 'Features', value: list.length, icon: 'pi pi-th-large', tone: 'primary' },
      { key: 'menus', label: 'Menus', value: menus, icon: 'pi pi-folder', tone: 'info' },
      { key: 'submenus', label: 'Submenus', value: submenus, icon: 'pi pi-file', tone: 'success' },
      { key: 'items', label: 'All items', value: menus + submenus, icon: 'pi pi-sitemap', tone: 'neutral' }
    ];
  });

  readonly filteredGroups = computed<MenuCatalogGroup[]>(() => {
    const query = this.appliedSearch().trim().toLowerCase();
    const source = this.groups();
    if (!query) return source;
    return source.filter(group => this.groupMatches(group, query));
  });

  get pagedGroups(): MenuCatalogGroup[] {
    return slicePage(this.filteredGroups(), this.page, this.pageSize);
  }

  get selectedGroup(): MenuCatalogGroup | null {
    if (this.selectedKey == null) return null;
    return this.filteredGroups().find(group => group.key === this.selectedKey) ?? null;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getOrganizationMenuCatalog().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: menus => {
        this.groups.set(this.buildGroups(Array.isArray(menus) ? menus : []));
        this.page = 0;
        this.ensureSelected();
      },
      error: () => {
        this.groups.set([]);
        this.selectedKey = null;
        this.errorMessage = 'Could not load the menu catalog for this organization.';
      }
    });
  }

  onListViewModeChange(mode: AppListViewMode): void {
    this.viewMode.set(mode);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  applySearch(): void {
    this.appliedSearch.set(this.search());
    this.page = 0;
    this.ensureSelected();
  }

  reset(): void {
    this.search.set('');
    this.appliedSearch.set('');
    this.page = 0;
    this.ensureSelected();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.cdr.markForCheck();
  }

  selectGroup(group: MenuCatalogGroup): void {
    this.selectedKey = group.key;
    this.revealExpandedCard();
  }

  groupIcon(group: MenuCatalogGroup): string {
    return normalizePrimeIcon(group.icon || 'pi pi-box');
  }

  menuIcon(menu: AccessMenu): string {
    return normalizePrimeIcon(menu.icon || menu.featureIcon || 'pi pi-folder');
  }

  childrenOf(menu: AccessMenu): AccessMenu[] {
    return this.sortedMenus(menu.children);
  }

  menuSummary(menu: AccessMenu): string {
    return menu.description?.trim()
      || (menu.menuType === 'MODULE' ? 'Menu group' : (menu.route || menu.menuCode || 'Page'));
  }

  menuNames(group: MenuCatalogGroup): string {
    return group.menus.map(menu => menu.menuName).join(', ') || '—';
  }

  scopeLabel(group: MenuCatalogGroup): string {
    return group.scope === 'CORE' ? 'Included' : 'Plan';
  }

  trackByGroup(_: number, group: MenuCatalogGroup): string {
    return group.key;
  }

  trackByMenu(_: number, menu: AccessMenu): number {
    return menu.id;
  }

  private buildGroups(tree: AccessMenu[]): MenuCatalogGroup[] {
    const byFeature = new Map<number, MenuCatalogGroup>();
    const standalone: MenuCatalogGroup[] = [];

    for (const menu of this.sortedMenus(tree)) {
      if (menu.featureId) {
        let group = byFeature.get(menu.featureId);
        if (!group) {
          group = this.emptyGroup(
            `feature-${menu.featureId}`,
            menu.featureName || menu.menuName,
            menu.featureCode || menu.menuCode,
            menu.featureIcon || menu.icon,
            menu.menuScope
          );
          byFeature.set(menu.featureId, group);
        }
        group.menus.push(menu);
        continue;
      }
      standalone.push(this.groupFromMenu(menu));
    }

    return [...byFeature.values(), ...standalone].map(group => this.withCounts(group));
  }

  private groupFromMenu(menu: AccessMenu): MenuCatalogGroup {
    return {
      key: `menu-${menu.id}`,
      title: menu.menuName,
      code: menu.menuCode,
      description: menu.description?.trim() || '',
      icon: menu.icon || menu.featureIcon || 'pi pi-folder',
      scope: menu.menuScope || 'SUBSCRIPTION',
      menus: [menu],
      menuCount: 0,
      submenuCount: 0
    };
  }

  private emptyGroup(
    key: string,
    title: string,
    code: string,
    icon: string | undefined,
    scope: AccessMenu['menuScope']
  ): MenuCatalogGroup {
    return {
      key,
      title,
      code,
      description: '',
      icon: icon || 'pi pi-box',
      scope: scope || 'SUBSCRIPTION',
      menus: [],
      menuCount: 0,
      submenuCount: 0
    };
  }

  private withCounts(group: MenuCatalogGroup): MenuCatalogGroup {
    const menus = this.sortedMenus(group.menus);
    const submenuCount = menus.reduce((sum, menu) => sum + this.descendantCount(menu), 0);
    const description = group.description
      || menus.map(menu => menu.description?.trim()).find(Boolean)
      || '';
    const scope = menus.some(menu => menu.menuScope === 'CORE') && menus.every(menu => menu.menuScope === 'CORE')
      ? 'CORE'
      : (menus.some(menu => menu.menuScope === 'SUBSCRIPTION') ? 'SUBSCRIPTION' : group.scope);
    return {
      ...group,
      menus,
      description,
      scope,
      menuCount: menus.length,
      submenuCount
    };
  }

  private descendantCount(menu: AccessMenu): number {
    return this.childrenOf(menu).reduce((sum, child) => sum + 1 + this.descendantCount(child), 0);
  }

  private groupMatches(group: MenuCatalogGroup, query: string): boolean {
    const haystack = [
      group.title,
      group.code,
      group.description,
      ...group.menus.flatMap(menu => this.flatten(menu).map(item =>
        [item.menuName, item.menuCode, item.route, item.description].join(' ')
      ))
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  private flatten(menu: AccessMenu): AccessMenu[] {
    return [menu, ...this.childrenOf(menu).flatMap(child => this.flatten(child))];
  }

  private sortedMenus(menus: AccessMenu[] | null | undefined): AccessMenu[] {
    return [...(menus ?? [])].sort((left, right) =>
      (left.displayOrder ?? 0) - (right.displayOrder ?? 0)
      || (left.menuName || '').localeCompare(right.menuName || '')
    );
  }

  private ensureSelected(): void {
    const items = this.filteredGroups();
    if (!items.length) {
      this.selectedKey = null;
      return;
    }
    if (this.selectedKey != null && items.some(item => item.key === this.selectedKey)) {
      return;
    }
    this.selectedKey = items[0].key;
    const index = items.findIndex(item => item.key === this.selectedKey);
    if (index >= 0) this.page = Math.floor(index / this.pageSize);
  }

  private revealExpandedCard(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches) {
      queueMicrotask(() => document.querySelector('.cat-card.is-expanded')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  }
}
