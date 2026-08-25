import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AccessMenu } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ViewPreferenceService } from '../../../services/view-preference.service';

@Component({
  selector: 'app-menu-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent,
    AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent
  ],
  templateUrl: './menu-catalog.component.html',
  styleUrl: './menu-catalog.component.scss'
})
export class MenuCatalogComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewPrefs = inject(ViewPreferenceService);

  loading = true;
  errorMessage = '';
  search = '';
  appliedSearch = '';
  view: AppListViewMode = this.viewPrefs.globalDefault();
  menus: AccessMenu[] = [];
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly pageSizeOptions = UI_PAGINATION.options;
  expanded = new Set<number | string>();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getMenuTree().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: menus => {
        this.menus = Array.isArray(menus) ? menus : [];
        this.page = 0;
      },
      error: () => {
        this.menus = [];
        this.errorMessage = 'Could not load the menu catalog for this organization.';
      }
    });
  }

  get stats(): SaasStat[] {
    const all = this.flatten(this.menus);
    const modules = all.filter(m => (m.menuType || '').toUpperCase() === 'MODULE' || (m.children?.length ?? 0) > 0).length;
    const pages = all.filter(m => (m.menuType || '').toUpperCase() === 'PAGE').length;
    return [
      { key: 'modules', label: 'Modules', value: this.menus.length, icon: 'pi pi-folder', tone: 'primary' },
      { key: 'pages', label: 'Pages', value: pages, icon: 'pi pi-file', tone: 'success' },
      { key: 'items', label: 'All items', value: all.length, icon: 'pi pi-th-large', tone: 'info' },
      { key: 'shown', label: 'Modules shown', value: modules, icon: 'pi pi-check', tone: 'neutral' }
    ];
  }

  get filteredModules(): AccessMenu[] {
    return this.filterTree(this.menus, this.appliedSearch.trim().toLowerCase());
  }

  get pagedModules(): AccessMenu[] {
    const start = this.page * this.pageSize;
    return this.filteredModules.slice(start, start + this.pageSize);
  }

  get totalModules(): number {
    return this.filteredModules.length;
  }

  onViewChange(mode: AppListViewMode): void {
    this.view = mode;
    this.cdr.markForCheck();
  }

  onSearchTermChange(value: string): void {
    this.search = value;
  }

  applyQuery(): void {
    this.appliedSearch = this.search;
    this.page = 0;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.search = '';
    this.appliedSearch = '';
    this.page = 0;
    this.cdr.markForCheck();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.page = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
  }

  toggleCard(menu: AccessMenu): void {
    const key = this.nodeKey(menu);
    if (this.expanded.has(key)) this.expanded.delete(key);
    else this.expanded.add(key);
  }

  isExpanded(menu: AccessMenu): boolean {
    return this.expanded.has(this.nodeKey(menu));
  }

  childCount(menu: AccessMenu): number {
    return this.flatten(menu.children ?? []).length;
  }

  menuLabel(menu: AccessMenu | null | undefined): string {
    return (menu?.menuName || menu?.menuCode || 'Untitled menu').trim();
  }

  trackByMenu(_: number, menu: AccessMenu): string {
    return this.nodeKey(menu);
  }

  private nodeKey(menu: AccessMenu): string {
    return String(menu.id || menu.menuCode || menu.menuName);
  }

  private filterTree(items: AccessMenu[], query: string): AccessMenu[] {
    const source = Array.isArray(items) ? items : [];
    if (!query) return source;
    const out: AccessMenu[] = [];
    for (const item of source) {
      const children = this.filterTree(item.children ?? [], query);
      const haystack = [
        item.menuName, item.menuCode, item.route, item.description, item.parentMenuName
      ].map(value => (value || '').toLowerCase()).join(' ');
      if (haystack.includes(query) || children.length) {
        out.push({ ...item, children });
      }
    }
    return out;
  }

  private flatten(items: AccessMenu[]): AccessMenu[] {
    const out: AccessMenu[] = [];
    const walk = (list: AccessMenu[]) => {
      for (const item of list ?? []) {
        out.push(item);
        if (item.children?.length) walk(item.children);
      }
    };
    walk(items);
    return out;
  }
}
