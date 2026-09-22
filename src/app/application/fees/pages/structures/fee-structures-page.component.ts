import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { UI_PAGINATION, UI_SEARCH } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import { AcademicYearContextService } from '../../../../shared/services/academic-year-context.service';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import {
  AppGridTableToggleComponent,
  AppListViewMode,
  AppPaginatorComponent
} from '../../../../shared/ui/app-list';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { FeesApiService } from '../../services/fees-api.service';
import {
  ClassFeeConfiguredFilter,
  ClassFeeStructureOverview,
  FEE_FREQUENCY_OPTIONS,
  FEES_RESOURCES,
  FeeFrequency,
  FeeHead,
  FeeItemType,
  FeeServiceKey,
  FeeStructure
} from '../../models/fees.model';

@Component({
  selector: 'app-fee-structures-page',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ConfirmDialogModule,
    RouterLink,
    HasPermissionDirective,
    AppToastComponent,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    TcPageSkeletonComponent,
    AppGridTableToggleComponent,
    AppPaginatorComponent
  ],
  templateUrl: './fee-structures-page.component.html',
  styleUrls: ['./fee-structures-page.component.scss', '../../fees.shared.scss']
})
export class FeeStructuresPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);
  private readonly yearCtx = inject(AcademicYearContextService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewPrefs = inject(ViewPreferenceService);
  readonly permissions = inject(PermissionService);

  readonly resources = FEES_RESOURCES;
  readonly frequencies = FEE_FREQUENCY_OPTIONS;
  readonly statusOptions: { label: string; value: ClassFeeConfiguredFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Configured', value: 'CONFIGURED' },
    { label: 'Not Configured', value: 'NOT_CONFIGURED' }
  ];
  readonly pageSizeOptions = UI_PAGINATION.options;

  private readonly search$ = new Subject<string>();

  rows: ClassFeeStructureOverview[] = [];
  heads: FeeHead[] = [];
  loading = true;
  saving = false;
  error: string | null = null;
  academicYearId: number | null = null;
  yearEditable = true;
  yearName = '';

  q = '';
  configuredStatus: ClassFeeConfiguredFilter = 'ALL';
  viewMode: AppListViewMode = this.viewPrefs.globalDefault();
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;

  configureVisible = false;
  configureTarget: ClassFeeStructureOverview | null = null;
  editingExisting = false;

  form = this.fb.group({
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resources.STRUCTURES);
  }

  get hasActiveFilters(): boolean {
    return !!this.q.trim() || this.configuredStatus !== 'ALL';
  }

  get isFilterEmptyState(): boolean {
    return this.hasActiveFilters && !this.rows.length && !this.loading && !this.error;
  }

  ngOnInit(): void {
    this.yearCtx.ensureLoaded().subscribe();
    this.api.headLookups().subscribe({
      next: h => { this.heads = h ?? []; this.cdr.markForCheck(); },
      error: () => { this.heads = []; this.cdr.markForCheck(); }
    });

    this.search$
      .pipe(debounceTime(UI_SEARCH.debounceMs), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.load({ soft: true });
      });
  }

  onAcademicYearChange(yearId: number | null): void {
    this.academicYearId = yearId;
    this.yearName = this.yearCtx.selectedYearLabel();
    this.page = 0;
    this.syncYearEditableFromContext();
    if (yearId == null) {
      this.rows = [];
      this.total = 0;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    // Full skeleton so users clearly see year data is reloading.
    this.rows = [];
    this.total = 0;
    this.loading = true;
    this.cdr.markForCheck();
    this.load();
  }

  private syncYearEditableFromContext(): void {
    const status = String(this.yearCtx.selectedYear()?.status || '').toUpperCase();
    this.yearEditable = ['DRAFT', 'PREPARING', 'READY_FOR_APPROVAL', 'REJECTED', 'APPROVED'].includes(status);
  }

  onSearchChange(value: string): void {
    this.q = value ?? '';
    this.search$.next(this.q.trim());
  }

  onStatusFilterChange(value: ClassFeeConfiguredFilter): void {
    this.configuredStatus = value ?? 'ALL';
    this.page = 0;
    this.load({ soft: true });
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.size) {
      this.size = event.rows;
      this.page = 0;
    }
    this.load({ soft: true });
  }

  clearFilters(): void {
    this.q = '';
    this.configuredStatus = 'ALL';
    this.page = 0;
    this.load({ soft: true });
  }

  load(opts?: { soft?: boolean }): void {
    if (this.academicYearId == null) return;
    const soft = !!opts?.soft && this.rows.length > 0;
    if (!soft) {
      this.loading = true;
      this.rows = [];
    }
    this.error = null;
    this.api
      .classStructureOverview(
        this.academicYearId,
        { q: this.q.trim() || undefined, configuredStatus: this.configuredStatus },
        this.page,
        this.size
      )
      .pipe(finalizeBusy(v => {
        if (!soft) this.loading = v;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: page => {
          this.rows = page?.content ?? [];
          this.total = page?.totalElements ?? 0;
          if (this.rows.length) {
            this.yearEditable = !!this.rows[0].yearEditable;
            if (this.rows[0].academicYearName) {
              this.yearName = this.rows[0].academicYearName;
            }
          }
          this.cdr.markForCheck();
        },
        error: err => {
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load fee structures';
          this.cdr.markForCheck();
        }
      });
  }

  openDetails(row: ClassFeeStructureOverview): void {
    void this.router.navigate(['/app/fees/structures', row.classId], {
      queryParams: { yearId: this.academicYearId }
    });
  }

  openConfigure(row: ClassFeeStructureOverview, edit = false): void {
    if (!this.yearEditable || !this.canManage) return;
    this.configureTarget = row;
    this.editingExisting = edit || row.configured;
    this.form.reset();
    this.items.clear();

    if (row.configured && row.feeStructureId) {
      this.api.getStructureByClass(this.academicYearId!, row.classId).subscribe({
        next: detail => this.populateConfigureForm(detail),
        error: err => {
          this.feedback.error('Load failed', extractApiError(err, 'Request failed').message);
          this.addItem();
          this.configureVisible = true;
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.addItem();
    this.configureVisible = true;
    this.cdr.markForCheck();
  }

  private populateConfigureForm(detail: FeeStructure): void {
    this.items.clear();
    (detail.items ?? []).forEach(it => this.items.push(this.itemGroup(it)));
    if (!this.items.length) this.addItem();
    this.configureVisible = true;
    this.cdr.markForCheck();
  }

  itemGroup(it?: Partial<{
    feeHeadId: number;
    amount: number;
    frequency: FeeFrequency;
    type: FeeItemType;
    serviceKey: FeeServiceKey;
  }>) {
    return this.fb.group({
      feeHeadId: [it?.feeHeadId ?? null, Validators.required],
      amount: [it?.amount ?? null, [Validators.required, Validators.min(0.01)]],
      frequency: [it?.frequency ?? 'MONTHLY' as FeeFrequency, Validators.required],
      type: [it?.type ?? 'MANDATORY' as FeeItemType, Validators.required],
      serviceKey: [it?.serviceKey ?? 'NONE' as FeeServiceKey, Validators.required]
    });
  }

  addItem(): void {
    this.items.push(this.itemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length <= 1) return;
    this.items.removeAt(index);
  }

  onItemTypeChange(index: number): void {
    const ctrl = this.items.at(index);
    const type = ctrl.value.type as FeeItemType;
    if (type === 'MANDATORY') {
      ctrl.patchValue({ serviceKey: 'NONE' });
    } else if (ctrl.value.serviceKey === 'NONE') {
      ctrl.patchValue({ serviceKey: 'TRANSPORT' });
    }
  }

  annualize(amount: number, frequency: FeeFrequency): number {
    const n = Number(amount) || 0;
    switch (frequency) {
      case 'MONTHLY': return n * 12;
      case 'QUARTERLY': return n * 4;
      case 'HALF_YEARLY': return n * 2;
      default: return n;
    }
  }

  summaryRequired(): number {
    return this.items.controls
      .filter(c => c.value.type === 'MANDATORY')
      .reduce((s, c) => s + this.annualize(Number(c.value.amount || 0), c.value.frequency), 0);
  }

  summaryOptional(): number {
    return this.items.controls
      .filter(c => c.value.type === 'OPTIONAL')
      .reduce((s, c) => s + this.annualize(Number(c.value.amount || 0), c.value.frequency), 0);
  }

  summaryTotal(): number {
    return this.summaryRequired() + this.summaryOptional();
  }

  saveConfigure(): void {
    if (!this.configureTarget || !this.academicYearId || !this.yearEditable || !this.canManage) return;
    this.items.controls.forEach(c => c.markAllAsTouched());
    if (this.form.invalid || this.items.length < 1) {
      this.feedback.formError('Please complete all required fields.');
      return;
    }
    const headIds = this.items.controls.map(c => c.value.feeHeadId);
    if (new Set(headIds).size !== headIds.length) {
      this.feedback.formError('Duplicate fee heads are not allowed in one structure.');
      return;
    }
    for (const c of this.items.controls) {
      const type = c.value.type as FeeItemType;
      const service = c.value.serviceKey as FeeServiceKey;
      if (type === 'MANDATORY' && service !== 'NONE') {
        this.feedback.formError('Required items must use service NONE.');
        return;
      }
      if (type === 'OPTIONAL' && (service === 'NONE' || !service)) {
        this.feedback.formError('Optional items require TRANSPORT or HOSTEL.');
        return;
      }
    }

    const body = {
      academicYearId: this.academicYearId,
      classId: this.configureTarget.classId,
      // Due day is settings-driven — not shown in structure UI.
      dueDay: this.configureTarget.dueDay ?? 10,
      items: this.items.controls.map(c => ({
        feeHeadId: c.value.feeHeadId as number,
        amount: Number(c.value.amount),
        frequency: c.value.frequency as FeeFrequency,
        type: c.value.type as FeeItemType,
        serviceKey: c.value.serviceKey as FeeServiceKey
      }))
    };

    this.saving = true;
    this.api.configureClassStructure(body).pipe(finalizeBusy(v => {
      this.saving = v;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.configureVisible = false;
        this.feedback.success(
          this.editingExisting ? 'Fee structure updated' : 'Fee structure configured',
          this.configureTarget?.className ?? ''
        );
        this.load({ soft: true });
      },
      error: err => {
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
}
