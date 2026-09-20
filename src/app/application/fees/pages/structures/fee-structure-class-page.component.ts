import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { AcademicYearContextService } from '../../../../shared/services/academic-year-context.service';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { FeesApiService } from '../../services/fees-api.service';
import {
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
  selector: 'app-fee-structure-class-page',
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
    TcPageSkeletonComponent,
    KpiCardComponent,
    KpiGroupComponent
  ],
  templateUrl: './fee-structure-class-page.component.html',
  styleUrls: ['./fee-structure-class-page.component.scss', '../../fees.shared.scss']
})
export class FeeStructureClassPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);
  private readonly yearCtx = inject(AcademicYearContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissions = inject(PermissionService);

  readonly resources = FEES_RESOURCES;
  readonly frequencies = FEE_FREQUENCY_OPTIONS;

  classId: number | null = null;
  academicYearId: number | null = null;
  yearName = '';
  yearEditable = true;

  structure: FeeStructure | null = null;
  notConfigured = false;
  className = '';
  loading = true;
  error: string | null = null;
  saving = false;
  heads: FeeHead[] = [];

  configureVisible = false;
  editingExisting = false;

  copyVisible = false;
  copyCandidates: ClassFeeStructureOverview[] = [];
  copySelectedIds = new Set<number>();
  copyOnConflict: 'SKIP' | 'REPLACE' = 'SKIP';
  copyLoading = false;

  form = this.fb.group({
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resources.STRUCTURES);
  }

  get displayTitle(): string {
    const name = this.structure?.className || this.className || 'Class';
    return `${name} Fee Structure`;
  }

  ngOnInit(): void {
    this.api.headLookups().subscribe({
      next: h => { this.heads = h ?? []; this.cdr.markForCheck(); },
      error: () => { this.heads = []; }
    });

    this.yearCtx.ensureLoaded().subscribe(() => {
      const paramClassId = Number(this.route.snapshot.paramMap.get('classId'));
      const qpYear = Number(this.route.snapshot.queryParamMap.get('yearId'));
      this.classId = Number.isFinite(paramClassId) ? paramClassId : null;
      const yearId = Number.isFinite(qpYear) && qpYear > 0
        ? qpYear
        : this.yearCtx.selectedYearId();
      this.academicYearId = yearId;
      if (yearId != null) {
        this.yearCtx.selectYear(yearId);
        this.yearName = this.yearCtx.selectedYearLabel();
      }
      this.load();
    });
  }

  load(): void {
    if (this.classId == null || this.academicYearId == null) {
      this.loading = false;
      this.error = 'Missing class or academic year.';
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.error = null;
    this.notConfigured = false;
    this.structure = null;
    this.api
      .getStructureByClass(this.academicYearId, this.classId)
      .pipe(finalizeBusy(v => {
        this.loading = v;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: detail => {
          this.structure = detail;
          this.className = detail.className ?? this.className;
          this.yearEditable = detail.yearEditable !== false;
          if (detail.academicYearName) this.yearName = detail.academicYearName;
          this.notConfigured = false;
          this.cdr.markForCheck();
        },
        error: err => {
          const status = err?.status ?? err?.error?.status;
          const msg = extractApiError(err, 'Request failed').message || '';
          if (status === 404 || /not configured|not found/i.test(msg)) {
            this.notConfigured = true;
            this.structure = null;
            this.bootstrapClassMeta();
          } else {
            this.error = msg || 'Failed to load fee structure';
          }
          this.cdr.markForCheck();
        }
      });
  }

  /** When structure is missing, pull class name / yearEditable from overview. */
  private bootstrapClassMeta(): void {
    if (this.academicYearId == null || this.classId == null) return;
    this.api.classStructureOverview(this.academicYearId, {}, 0, 100).subscribe({
      next: page => {
        const row = (page?.content ?? []).find(c => c.classId === this.classId);
        if (row) {
          this.className = row.className;
          this.yearEditable = !!row.yearEditable;
          if (row.academicYearName) this.yearName = row.academicYearName;
        }
        this.cdr.markForCheck();
      },
      error: () => { /* keep defaults */ }
    });
  }

  openConfigure(edit = false): void {
    if (!this.yearEditable || !this.canManage || this.classId == null || this.academicYearId == null) return;
    this.editingExisting = edit || !!this.structure;
    this.form.reset();
    this.items.clear();
    this.configureVisible = false;

    if (this.editingExisting) {
      this.api.getStructureByClass(this.academicYearId, this.classId).subscribe({
        next: detail => {
          this.structure = detail;
          this.className = detail.className ?? this.className;
          (detail.items ?? []).forEach(it => this.items.push(this.itemGroup(it)));
          if (!this.items.length) this.addItem();
          this.configureVisible = true;
          this.cdr.markForCheck();
        },
        error: err => {
          this.feedback.error('Load failed', extractApiError(err, 'Request failed').message);
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.addItem();
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
    if (!this.yearEditable || !this.canManage || this.classId == null || this.academicYearId == null) return;
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
      classId: this.classId,
      // Due day is settings-driven — not shown in structure UI.
      dueDay: this.structure?.dueDay ?? 10,
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
          this.className || ''
        );
        this.load();
      },
      error: err => {
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  openCopy(): void {
    if (!this.structure?.feeStructureId || !this.yearEditable || !this.canManage) return;
    this.copySelectedIds = new Set();
    this.copyOnConflict = 'SKIP';
    this.copyVisible = true;
    this.copyLoading = true;
    this.copyCandidates = [];
    this.api
      .classStructureOverview(this.academicYearId!, { configuredStatus: 'ALL' }, 0, 100)
      .pipe(finalizeBusy(v => {
        this.copyLoading = v;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: page => {
          this.copyCandidates = (page?.content ?? []).filter(c => c.classId !== this.classId);
          this.cdr.markForCheck();
        },
        error: err => {
          this.feedback.error('Load failed', extractApiError(err, 'Request failed').message);
          this.copyVisible = false;
        }
      });
  }

  toggleCopyClass(classId: number, checked: boolean): void {
    if (checked) this.copySelectedIds.add(classId);
    else this.copySelectedIds.delete(classId);
  }

  isCopySelected(classId: number): boolean {
    return this.copySelectedIds.has(classId);
  }

  saveCopy(): void {
    if (!this.structure?.feeStructureId || !this.yearEditable || !this.canManage) return;
    const ids = [...this.copySelectedIds];
    if (!ids.length) {
      this.feedback.formError('Select at least one target class.');
      return;
    }
    this.saving = true;
    this.api
      .copyStructureToClasses(this.structure.feeStructureId, {
        targetClassIds: ids,
        onConflict: this.copyOnConflict
      })
      .pipe(finalizeBusy(v => {
        this.saving = v;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.copyVisible = false;
          this.feedback.success('Structure copied', `${ids.length} class(es)`);
        },
        error: err => {
          this.feedback.error('Copy failed', extractApiError(err, 'Request failed').message);
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

  frequencyLabel(f: FeeFrequency | string | undefined): string {
    return this.frequencies.find(x => x.value === f)?.label ?? String(f ?? '—');
  }

  serviceLabel(s: FeeServiceKey | string | undefined): string {
    switch (s) {
      case 'TRANSPORT': return 'Transport';
      case 'HOSTEL': return 'Hostel';
      case 'NONE': return 'None';
      default: return String(s ?? '—');
    }
  }
}
