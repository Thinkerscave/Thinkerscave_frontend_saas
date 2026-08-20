import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { forkJoin, Observable, finalize } from 'rxjs';

import {
  AccessMenu,
  CreateMenuPayload,
  MenuScope,
  MenuType,
  UpdateMenuPayload
} from '../../../access-management/models/access.model';
import { AccessManagementService } from '../../../access-management/services/access-management.service';
import { PlatformFeature } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { SIDEBAR_ICON_OPTIONS, normalizePrimeIcon } from '../../../../shared/utils/prime-icon.util';
import {
  SaasPageHeaderComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { AppListViewMode } from '../../../../shared/ui/app-list';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

interface MenuRow {
  menu: AccessMenu;
  depth: number;
}

interface MenuDraft {
  id?: number;
  menuCode: string;
  menuName: string;
  description: string;
  route: string;
  icon: string;
  menuType: MenuType;
  parentMenuId: number | null;
  displayOrder: number;
  active: boolean;
  menuScope: MenuScope;
  featureId: number | null;
  iconSearch: string;
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, DropdownModule, ConfirmDialogModule, DialogModule,
    DragDropModule,
    SaasPageHeaderComponent, SaasStatGridComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './menu-management.component.html',
  styleUrl: './menu-management.component.scss'
})
export class MenuManagementComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly platformApi = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);
  private readonly confirm = inject(ConfirmationService);

  loading = true;
  saving = false;
  reordering = false;
  errorMessage = '';
  search = '';
  editorOpen = false;
  viewMode: AppListViewMode = 'grid';
  page = 1;
  pageSize = 8;
  menus: AccessMenu[] = [];
  parents: AccessMenu[] = [];
  rows: MenuRow[] = [];
  features: PlatformFeature[] = [];
  selectedParent: AccessMenu | null = null;
  draft: MenuDraft = this.emptyDraft();

  readonly menuScopes: { label: string; value: MenuScope }[] = [
    { label: 'Subscription', value: 'SUBSCRIPTION' },
    { label: 'Core', value: 'CORE' },
    { label: 'Platform', value: 'PLATFORM' }
  ];
  readonly iconOptions = SIDEBAR_ICON_OPTIONS;
  readonly normalizePrimeIcon = normalizePrimeIcon;

  ngOnInit(): void { this.load(); }

  get stats(): SaasStat[] {
    const all = this.rows.map(r => r.menu);
    const menus = all.filter(m => m.parentMenuId == null);
    const submenus = all.filter(m => m.parentMenuId != null);
    const pages = all.filter(m => m.menuType === 'PAGE');
    const drafts = all.filter(m => m.active === false);
    return [
      {
        key: 'menus',
        label: 'Menu Count',
        value: menus.length,
        icon: 'pi pi-sitemap',
        tone: 'primary',
        helper: 'Top-level sidebar entries such as Dashboard, Academics, and Staff.'
      },
      {
        key: 'submenus',
        label: 'Submenu Count',
        value: submenus.length,
        icon: 'pi pi-list',
        tone: 'info',
        helper: 'Nested items under a parent menu, for example Academic Year under Academics.'
      },
      {
        key: 'pages',
        label: 'Page Count',
        value: pages.length,
        icon: 'pi pi-file',
        tone: 'success',
        helper: 'Leaf screens with a route that a user can open.'
      },
      {
        key: 'drafts',
        label: 'Draft Count',
        value: drafts.length,
        icon: 'pi pi-pencil',
        tone: 'warning',
        helper: 'Inactive catalog items that tenants cannot see until they are activated.'
      }
    ];
  }

  get filteredRows(): MenuRow[] {
    return this.applySearch(this.rows);
  }

  get pagedRows(): MenuRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get filteredParents(): AccessMenu[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.parents;
    return this.parents.filter(menu => this.matchesSearch(menu, q) || (menu.children ?? []).some(child => this.matchesSearch(child, q)));
  }

  get pagedParents(): AccessMenu[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredParents.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredParents.length / this.pageSize) || 1);
  }

  get pageStart(): number {
    return this.filteredParents.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredParents.length);
  }

  get tableTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize) || 1);
  }

  get tablePageStart(): number {
    return this.filteredRows.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get tablePageEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredRows.length);
  }

  get selectedChildren(): AccessMenu[] {
    return [...(this.selectedParent?.children ?? [])]
      .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0));
  }

  get parentOptions(): { label: string; value: number | null }[] {
    const options: { label: string; value: number | null }[] = [{ label: 'Top level (no parent)', value: null }];
    for (const row of this.rows) {
      if (this.isGroup(row.menu) && row.menu.id !== this.draft.id) {
        options.push({ label: `${'— '.repeat(row.depth)}${row.menu.menuName}`, value: row.menu.id });
      }
    }
    return options;
  }

  get featureOptions(): { label: string; value: number | null }[] {
    return [
      { label: 'None', value: null },
      ...this.features.filter(f => f.active !== false).map(f => ({
        label: `${f.displayName || f.featureName} (${f.featureCode})`,
        value: f.id
      }))
    ];
  }

  get filteredIcons(): { label: string; value: string }[] {
    const q = this.draft.iconSearch.trim().toLowerCase();
    if (!q) return this.iconOptions;
    return this.iconOptions.filter(i => i.label.toLowerCase().includes(q) || i.value.includes(q));
  }

  get isChild(): boolean {
    return this.draft.parentMenuId != null;
  }

  get isGroupDraft(): boolean {
    return !this.isChild && this.draft.menuType === 'MODULE';
  }

  get dialogTitle(): string {
    if (this.draft.id) return 'Edit menu';
    return this.isChild ? 'Add submenu' : 'Add menu';
  }

  onListViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.page = 1;
  }

  setPage(next: number): void {
    const max = this.viewMode === 'table' ? this.tableTotalPages : this.totalPages;
    this.page = Math.min(Math.max(1, next), max);
  }

  setPageSize(size: number | string): void {
    this.pageSize = Number(size);
    this.page = 1;
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
    this.ensureSelectedParent();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      menus: this.api.getMenuTree(true),
      features: this.platformApi.getFeatures()
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ menus, features }) => {
        this.menus = menus ?? [];
        this.parents = [...this.menus];
        this.rows = this.flatten(this.menus);
        this.features = features ?? [];
        this.ensureSelectedParent();
      },
      error: () => {
        this.menus = [];
        this.parents = [];
        this.rows = [];
        this.errorMessage = 'Could not load menus.';
      }
    });
  }

  selectParent(menu: AccessMenu): void {
    this.selectedParent = menu;
    this.revealExpandedCard();
  }

  scopeLabel(menu: AccessMenu): string {
    return this.menuScopes.find(scope => scope.value === menu.menuScope)?.label || menu.menuScope || '—';
  }

  isGroup(menu: AccessMenu): boolean {
    return menu.menuType === 'MODULE' || !!(menu.children && menu.children.length);
  }

  openCreate(parent?: AccessMenu): void {
    this.draft = this.emptyDraft();
    if (parent) {
      this.draft.parentMenuId = parent.id;
      this.draft.menuType = 'PAGE';
      this.draft.menuScope = parent.menuScope ?? 'SUBSCRIPTION';
      this.draft.featureId = parent.featureId ?? null;
      this.draft.displayOrder = (parent.children?.length ?? 0) + 1;
    } else {
      this.draft.displayOrder = this.parents.length + 1;
    }
    this.editorOpen = true;
  }

  openEdit(menu: AccessMenu): void {
    this.draft = {
      id: menu.id,
      menuCode: menu.menuCode,
      menuName: menu.menuName,
      description: menu.description ?? '',
      route: menu.route ?? '',
      icon: normalizePrimeIcon(menu.icon),
      menuType: menu.menuType ?? (this.isGroup(menu) ? 'MODULE' : 'PAGE'),
      parentMenuId: menu.parentMenuId ?? null,
      displayOrder: menu.displayOrder ?? 1,
      active: menu.active !== false,
      menuScope: menu.menuScope ?? 'SUBSCRIPTION',
      featureId: menu.featureId ?? null,
      iconSearch: ''
    };
    this.editorOpen = true;
  }

  closeEditor(): void { this.editorOpen = false; }

  setShape(group: boolean): void {
    if (this.draft.id || this.isChild) return;
    this.draft.menuType = group ? 'MODULE' : 'PAGE';
    if (group) this.draft.route = '';
  }

  onParentChange(): void {
    if (this.isChild) {
      this.draft.menuType = 'PAGE';
      const parent = this.rows.find(row => row.menu.id === this.draft.parentMenuId)?.menu;
      if (parent) {
        this.draft.menuScope = parent.menuScope ?? this.draft.menuScope;
        this.draft.featureId = parent.featureId ?? null;
      }
    }
  }

  save(): void {
    if (!this.draft.menuName.trim()) {
      this.feedback.warn('Missing fields', 'Menu name is required.');
      return;
    }
    if (!this.draft.id && !this.draft.menuCode.trim()) {
      this.feedback.warn('Missing fields', 'Menu code is required.');
      return;
    }
    if (!this.isGroupDraft && !this.draft.route.trim()) {
      this.feedback.warn('Missing fields', 'A route is required for a single-page menu.');
      return;
    }
    this.saving = true;
    const request$ = this.draft.id
      ? this.api.updateMenu(this.draft.id, this.toUpdatePayload())
      : this.api.createMenu(this.toCreatePayload());
    request$.pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.feedback.success('Saved', this.draft.active ? 'Menu is live for entitled tenants.' : 'Menu saved as draft.');
        this.editorOpen = false;
        this.load();
      },
      error: () => this.feedback.warn('Save failed', 'Could not save the menu. Check the code format and try again.')
    });
  }

  confirmDelete(menu: AccessMenu): void {
    this.confirm.confirm({
      header: 'Delete menu?',
      message: `Remove "${menu.menuName}" from the catalog? Tenants will no longer see it.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.deleteMenu(menu.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          if (this.selectedParent?.id === menu.id) this.selectedParent = null;
          this.feedback.success('Deleted', `${menu.menuName} was removed.`);
          this.load();
        },
        error: () => this.feedback.warn('Delete failed', 'Remove child menus first, then try again.')
      })
    });
  }

  dropParents(event: CdkDragDrop<AccessMenu[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const moved = this.pagedParents[event.previousIndex];
    const target = this.pagedParents[event.currentIndex];
    if (!moved || !target) return;
    const from = this.parents.findIndex(item => item.id === moved.id);
    const to = this.parents.findIndex(item => item.id === target.id);
    if (from < 0 || to < 0) return;
    moveItemInArray(this.parents, from, to);
    this.persistOrder(this.parents);
  }

  dropChildren(event: CdkDragDrop<AccessMenu[]>): void {
    if (!this.selectedParent?.children || event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.selectedParent.children, event.previousIndex, event.currentIndex);
    this.persistOrder(this.selectedParent.children);
  }

  dropTableRow(event: CdkDragDrop<MenuRow[]>): void {
    const moved = this.pagedRows[event.previousIndex];
    const target = this.pagedRows[event.currentIndex];
    if (!moved || !target || moved.menu.parentMenuId !== target.menu.parentMenuId) {
      this.feedback.warn('Reorder', 'Drag items that share the same parent.');
      return;
    }
    const siblings = this.siblingMenus(moved.menu.parentMenuId ?? null);
    const from = siblings.findIndex(m => m.id === moved.menu.id);
    const to = siblings.findIndex(m => m.id === target.menu.id);
    if (from < 0 || to < 0 || from === to) return;
    moveItemInArray(siblings, from, to);
    this.persistOrder(siblings);
  }

  statusTone(menu: AccessMenu): 'success' | 'warning' | 'danger' {
    return menu.active === false ? 'warning' : 'success';
  }

  statusLabel(menu: AccessMenu): string {
    return menu.active === false ? 'Draft' : 'Saved';
  }

  shapeLabel(menu: AccessMenu): string {
    return this.isGroup(menu) ? 'Group' : 'Page';
  }

  childCount(menu: AccessMenu): number {
    return menu.children?.length ?? 0;
  }

  trackByRow(_: number, row: MenuRow): number { return row.menu.id; }
  trackByMenu(_: number, menu: AccessMenu): number { return menu.id; }

  private persistOrder(items: AccessMenu[]): void {
    const requests = items
      .map((menu, index) => {
        const displayOrder = index + 1;
        if (menu.displayOrder === displayOrder) return null;
        menu.displayOrder = displayOrder;
        return this.api.updateMenu(menu.id, this.toOrderPayload(menu, displayOrder));
      })
      .filter((req): req is Observable<AccessMenu> => !!req);
    if (!requests.length) return;
    this.reordering = true;
    forkJoin(requests).pipe(
      finalize(() => { this.reordering = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.load(),
      error: () => this.feedback.warn('Reorder failed', 'Could not save the new display order.')
    });
  }

  private siblingMenus(parentId: number | null): AccessMenu[] {
    if (parentId == null) return this.parents;
    return this.parents.find(m => m.id === parentId)?.children ?? [];
  }

  private applySearch(rows: MenuRow[]): MenuRow[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ menu }) => this.matchesSearch(menu, q));
  }

  private matchesSearch(menu: AccessMenu, q: string): boolean {
    return menu.menuName.toLowerCase().includes(q)
      || (menu.menuCode ?? '').toLowerCase().includes(q)
      || (menu.route ?? '').toLowerCase().includes(q);
  }

  private emptyDraft(): MenuDraft {
    return {
      menuCode: '',
      menuName: '',
      description: '',
      route: '',
      icon: 'pi pi-circle',
      menuType: 'PAGE',
      parentMenuId: null,
      displayOrder: 1,
      active: true,
      menuScope: 'SUBSCRIPTION',
      featureId: null,
      iconSearch: ''
    };
  }

  private toCreatePayload(): CreateMenuPayload {
    return {
      menuCode: this.draft.menuCode.trim().toUpperCase().replace(/\s+/g, '_'),
      menuName: this.draft.menuName.trim(),
      description: this.draft.description.trim() || undefined,
      route: this.isGroupDraft ? undefined : this.draft.route.trim() || undefined,
      icon: this.draft.icon,
      menuType: this.draft.menuType,
      parentMenuId: this.draft.parentMenuId,
      displayOrder: this.draft.displayOrder,
      showInSidebar: true,
      defaultPage: false,
      active: this.draft.active,
      menuScope: this.isChild ? undefined : this.draft.menuScope,
      featureId: this.isChild ? null : this.draft.featureId
    };
  }

  private toUpdatePayload(): UpdateMenuPayload {
    return {
      menuName: this.draft.menuName.trim(),
      description: this.draft.description.trim() || undefined,
      route: this.isGroupDraft ? undefined : this.draft.route.trim() || undefined,
      icon: this.draft.icon,
      parentMenuId: this.draft.parentMenuId,
      displayOrder: this.draft.displayOrder,
      showInSidebar: true,
      defaultPage: false,
      active: this.draft.active,
      menuScope: this.isChild ? undefined : this.draft.menuScope,
      featureId: this.isChild ? null : this.draft.featureId
    };
  }

  private toOrderPayload(menu: AccessMenu, displayOrder: number): UpdateMenuPayload {
    return {
      menuName: menu.menuName,
      description: menu.description,
      route: menu.route,
      icon: menu.icon,
      parentMenuId: menu.parentMenuId ?? null,
      displayOrder,
      showInSidebar: true,
      defaultPage: false,
      active: menu.active !== false,
      menuScope: menu.menuScope,
      featureId: menu.featureId ?? null
    };
  }

  private flatten(items: AccessMenu[], depth = 0): MenuRow[] {
    const out: MenuRow[] = [];
    for (const menu of items ?? []) {
      out.push({ menu, depth });
      if (menu.children?.length) out.push(...this.flatten(menu.children, depth + 1));
    }
    return out;
  }

  private ensureSelectedParent(): void {
    const list = this.filteredParents;
    if (!list.length) {
      this.selectedParent = null;
      return;
    }
    if (this.selectedParent && list.some(menu => menu.id === this.selectedParent?.id)) {
      this.selectedParent = list.find(menu => menu.id === this.selectedParent?.id) ?? this.selectedParent;
      return;
    }
    this.selectedParent = this.preferredParent(list);
    const index = list.findIndex(menu => menu.id === this.selectedParent?.id);
    if (index >= 0) this.page = Math.floor(index / this.pageSize) + 1;
  }

  private preferredParent(list: AccessMenu[]): AccessMenu {
    return list.find(menu => (menu.menuCode ?? '').toUpperCase() === 'DASHBOARD'
      || (menu.route ?? '').replace(/\/+$/, '') === '/app')
      ?? list[0];
  }

  private revealExpandedCard(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches) {
      queueMicrotask(() => document.querySelector('.cat-card.is-expanded')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  }
}
