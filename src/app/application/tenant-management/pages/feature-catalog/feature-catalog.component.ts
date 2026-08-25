import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { AccessMenu } from '../../../access-management/models/access.model';
import { AccessManagementService } from '../../../access-management/services/access-management.service';
import { PlatformFeature, PlatformFeaturePayload } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  SaasPageHeaderComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPageChangeEvent, slicePage } from '../../../../shared/utils/paged-result.util';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { normalizePrimeIcon } from '../../../../shared/utils/prime-icon.util';

interface FeatureDraft {
  id?: number;
  featureCode: string;
  featureName: string;
  displayName: string;
  module: string;
  category: string;
  description: string;
  icon: string;
  displayOrder: number;
  premiumFeature: boolean;
  visible: boolean;
  defaultEnabled: boolean;
  remarks: string;
  menuIds: number[];
}

interface FeatureShowcase {
  feature: PlatformFeature;
  menus: AccessMenu[];
  pageCount: number;
}

@Component({
  selector: 'tc-feature-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    DialogModule,
    ConfirmDialogModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    AppListToolbarComponent,
    AppPaginatorComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './feature-catalog.component.html',
  styleUrl: './feature-catalog.component.scss'
})
export class FeatureCatalogComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly accessApi = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(UiFeedbackService);
  private readonly confirm = inject(ConfirmationService);
  private readonly viewPrefs = inject(ViewPreferenceService);

  loading = true;
  saving = false;
  editorOpen = false;
  errorMessage = '';
  menus: AccessMenu[] = [];
  draft: FeatureDraft = this.emptyDraft();
  selectedFeatureId: number | null = null;
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly normalizePrimeIcon = normalizePrimeIcon;

  readonly search = signal('');
  readonly appliedSearch = signal('');
  readonly categoryFilter = signal('all');
  readonly appliedCategory = signal('all');
  readonly viewMode = signal<AppListViewMode>(this.viewPrefs.globalDefault());
  readonly modules = signal<PlatformFeature[]>([]);

  ngOnInit(): void { this.load(); }

  onListViewModeChange(mode: AppListViewMode): void {
    this.viewMode.set(mode);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onCategoryChange(value: string): void {
    this.categoryFilter.set(value);
  }

  applySearch(): void {
    this.appliedSearch.set(this.search());
    this.page = 0;
    this.ensureSelectedFeature();
  }

  applyFilters(): void {
    this.appliedSearch.set(this.search());
    this.appliedCategory.set(this.categoryFilter());
    this.page = 0;
    this.ensureSelectedFeature();
  }

  readonly categories = computed(() => {
    const cats = new Set(this.modules().map(m => m.category || m.module || 'General'));
    return ['all', ...Array.from(cats).sort()];
  });

  readonly categoryOptions = computed(() =>
    this.categories().map(c => ({
      label: c === 'all' ? 'All categories' : c,
      value: c
    }))
  );

  readonly stats = computed<SaasStat[]>(() => {
    const list = this.modules();
    return [
      { key: 'total', label: 'Features', value: list.length, icon: 'pi pi-th-large', tone: 'primary' },
      { key: 'active', label: 'Active', value: list.filter(m => m.active !== false).length, icon: 'pi pi-check', tone: 'success' },
      { key: 'premium', label: 'Premium', value: list.filter(m => m.premiumFeature).length, icon: 'pi pi-star', tone: 'warning' },
      { key: 'mapped', label: 'Mapped', value: list.filter(m => this.menusFor(m).length).length, icon: 'pi pi-sitemap', tone: 'info' }
    ];
  });

  readonly filtered = computed<PlatformFeature[]>(() => {
    const q = this.appliedSearch().trim().toLowerCase();
    const cat = this.appliedCategory();
    return this.modules()
      .filter(m => {
        const category = m.category || m.module || 'General';
        if (cat !== 'all' && category !== cat) return false;
        if (!q) return true;
        return (m.featureName?.toLowerCase().includes(q)
          || m.featureCode?.toLowerCase().includes(q)
          || m.description?.toLowerCase().includes(q)
          || this.blurb(m).toLowerCase().includes(q));
      })
      .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0)
        || (left.featureName || '').localeCompare(right.featureName || ''));
  });

  readonly showcases = computed<FeatureShowcase[]>(() =>
    this.filtered().map(feature => {
      const menus = this.sortedMenus(this.menusFor(feature));
      return {
        feature,
        menus,
        pageCount: menus.reduce((count, menu) => count + 1 + this.sortedMenus(menu.children).length, 0)
      };
    })
  );

  get pagedShowcases(): FeatureShowcase[] {
    return slicePage(this.showcases(), this.page, this.pageSize);
  }

  get pageSizeOptions(): number[] {
    return UI_PAGINATION.options;
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.cdr.markForCheck();
  }

  get selectedShowcase(): FeatureShowcase | null {
    if (this.selectedFeatureId == null) return null;
    return this.showcases().find(item => item.feature.id === this.selectedFeatureId) ?? null;
  }

  get mappableMenus(): AccessMenu[] {
    return this.sortedMenus(
      (this.menus ?? []).filter(m => (m.menuScope ?? 'SUBSCRIPTION') !== 'PLATFORM')
    );
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      features: this.api.getFeatures(),
      menus: this.accessApi.getMenuTree(true)
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ features, menus }) => {
        this.menus = menus ?? [];
        this.modules.set(features ?? []);
        this.ensureSelectedFeature();
      },
      error: () => {
        this.errorMessage = 'Unable to load feature catalog from platform API.';
        this.modules.set([]);
        this.menus = [];
      }
    });
  }

  selectFeature(feature: PlatformFeature): void {
    this.selectedFeatureId = feature.id;
    this.revealExpandedCard();
  }

  openCreate(): void {
    this.draft = this.emptyDraft();
    this.editorOpen = true;
  }

  openEdit(feature: PlatformFeature, event?: Event): void {
    event?.stopPropagation();
    this.draft = {
      id: feature.id,
      featureCode: feature.featureCode,
      featureName: feature.featureName,
      displayName: feature.displayName ?? '',
      module: feature.module ?? '',
      category: feature.category ?? '',
      description: feature.description ?? '',
      icon: feature.icon ?? 'pi pi-box',
      displayOrder: feature.displayOrder ?? 0,
      premiumFeature: !!feature.premiumFeature,
      visible: feature.visible !== false,
      defaultEnabled: !!feature.defaultEnabled,
      remarks: '',
      menuIds: this.menusFor(feature).map(m => m.id)
    };
    this.editorOpen = true;
    this.api.getFeatureMenus(feature.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: mapped => {
        this.draft.menuIds = (mapped ?? []).map(m => m.id);
        this.cdr.markForCheck();
      }
    });
  }

  closeEditor(): void { this.editorOpen = false; }

  isMenuSelected(menuId: number): boolean {
    return this.draft.menuIds.includes(menuId);
  }

  onMenuToggle(menuId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.draft.menuIds = checked
      ? Array.from(new Set([...this.draft.menuIds, menuId]))
      : this.draft.menuIds.filter(id => id !== menuId);
  }

  unmapMenu(feature: PlatformFeature, menu: AccessMenu, event?: Event): void {
    event?.stopPropagation();
    const nextIds = this.menusFor(feature).map(m => m.id).filter(id => id !== menu.id);
    this.api.replaceFeatureMenus(feature.id, nextIds).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.feedback.success('Updated', `${menu.menuName} was removed from ${feature.featureName}.`);
        this.load();
      },
      error: () => this.feedback.warn('Update failed', 'Could not unmap this menu.')
    });
  }

  save(): void {
    if (!this.draft.featureName.trim() || (!this.draft.id && !this.draft.featureCode.trim()) || !this.draft.module.trim()) {
      this.feedback.warn('Missing fields', 'Feature code, name and module are required.');
      return;
    }
    this.saving = true;
    const payload = this.toPayload();
    const request$ = this.draft.id
      ? this.api.updateFeature(this.draft.id, payload)
      : this.api.createFeature(payload);

    request$.pipe(
      switchMap(feature => this.api.replaceFeatureMenus(feature.id, this.draft.menuIds).pipe(
        switchMap(() => of(feature))
      )),
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.feedback.success('Saved', 'Feature saved. Entitled tenants receive the mapped menus.');
        this.editorOpen = false;
        this.load();
      },
      error: () => this.feedback.warn('Save failed', 'Could not save the feature. Use a unique FEATURE_CODE.')
    });
  }

  confirmArchive(feature: PlatformFeature, event?: Event): void {
    event?.stopPropagation();
    this.confirm.confirm({
      header: 'Delete feature?',
      message: `Delete "${feature.featureName}" from the catalog? It will no longer be available for new mappings.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.deleteFeature(feature.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.feedback.success('Deleted', `${feature.featureName} was removed from the catalog.`);
          this.load();
        },
        error: () => this.feedback.warn('Delete failed', 'Could not delete this feature.')
      })
    });
  }

  blurb(feature: PlatformFeature): string {
    return feature.description?.trim() || 'No description yet. Add one so customers can see what this feature includes.';
  }

  menuNames(item: FeatureShowcase): string {
    return item.menus.map(menu => menu.menuName).join(', ') || '—';
  }

  typeLabel(feature: PlatformFeature): string {
    if (feature.active === false) return 'Archived';
    if (feature.premiumFeature) return 'Premium';
    if (feature.defaultEnabled) return 'Included';
    return 'Optional';
  }

  mappedHint(menu: AccessMenu): string {
    if (!menu.featureId || this.draft.id === menu.featureId) return '';
    return menu.featureName ? `Currently ${menu.featureName}` : 'Mapped to another feature';
  }

  featureIcon(feature: PlatformFeature): string {
    return normalizePrimeIcon(feature.icon || 'pi pi-box');
  }

  reset(): void {
    this.search.set('');
    this.appliedSearch.set('');
    this.categoryFilter.set('all');
    this.appliedCategory.set('all');
    this.page = 0;
    this.ensureSelectedFeature();
  }

  trackByFeature(_: number, item: PlatformFeature): number { return item.id; }
  trackByShowcase(_: number, item: FeatureShowcase): number { return item.feature.id; }
  trackByMenu(_: number, item: AccessMenu): number { return item.id; }

  pagesOf(menu: AccessMenu): AccessMenu[] {
    return this.sortedMenus(menu.children);
  }

  menuSummary(menu: AccessMenu): string {
    return menu.description?.trim()
      || (menu.menuType === 'MODULE' ? 'Menu group' : (menu.route || 'Page'));
  }

  pageSummary(page: AccessMenu): string {
    return page.description?.trim() || page.route || page.menuCode;
  }

  private menusFor(feature: PlatformFeature): AccessMenu[] {
    return (this.menus ?? []).filter(menu => menu.featureId === feature.id);
  }

  private sortedMenus(menus: AccessMenu[] | null | undefined): AccessMenu[] {
    return [...(menus ?? [])].sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0));
  }

  private ensureSelectedFeature(): void {
    const items = this.showcases();
    if (!items.length) {
      this.selectedFeatureId = null;
      return;
    }
    if (this.selectedFeatureId != null && items.some(item => item.feature.id === this.selectedFeatureId)) {
      return;
    }
    this.selectedFeatureId = items[0].feature.id;
    const index = items.findIndex(item => item.feature.id === this.selectedFeatureId);
    if (index >= 0) this.page = Math.floor(index / this.pageSize);
  }

  private emptyDraft(): FeatureDraft {
    return {
      featureCode: '',
      featureName: '',
      displayName: '',
      module: '',
      category: '',
      description: '',
      icon: 'pi pi-box',
      displayOrder: 1,
      premiumFeature: false,
      visible: true,
      defaultEnabled: false,
      remarks: '',
      menuIds: []
    };
  }

  private toPayload(): PlatformFeaturePayload {
    const code = this.draft.featureCode.trim().toUpperCase().replace(/\s+/g, '_');
    return {
      featureCode: code.startsWith('FEAT_') ? code : `FEAT_${code}`,
      featureName: this.draft.featureName.trim(),
      displayName: this.draft.displayName.trim() || this.draft.featureName.trim(),
      module: this.draft.module.trim(),
      category: this.draft.category.trim() || undefined,
      featureKey: code,
      description: this.draft.description.trim() || undefined,
      icon: this.draft.icon.trim() || undefined,
      displayOrder: this.draft.displayOrder,
      premiumFeature: this.draft.premiumFeature,
      visible: this.draft.visible,
      defaultEnabled: this.draft.defaultEnabled,
      remarks: this.draft.remarks.trim() || undefined
    };
  }

  private revealExpandedCard(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches) {
      queueMicrotask(() => document.querySelector('.cat-card.is-expanded')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  }
}
