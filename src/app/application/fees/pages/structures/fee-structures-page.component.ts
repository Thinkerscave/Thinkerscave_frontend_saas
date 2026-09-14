import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { environment } from '../../../../../environments/environment';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { FeesApiService } from '../../services/fees-api.service';
import {
  FEE_FREQUENCY_OPTIONS,
  FEES_RESOURCES,
  FeeFrequency,
  FeeHead,
  FeeItemType,
  FeeMasterStatus,
  FeeServiceKey,
  FeeStructure
} from '../../models/fees.model';

interface LookupOption { id: number; name: string; }

@Component({
  selector: 'app-fee-structures-page',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DialogModule, ConfirmDialogModule,
    HasPermissionDirective, AppToastComponent, SaasPageHeaderComponent, TcPageSkeletonComponent
  ],
  templateUrl: './fee-structures-page.component.html',
  styleUrls: ['./fee-structures-page.component.scss', '../../fees.shared.scss']
})
export class FeeStructuresPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly feedback = inject(UiFeedbackService);
  private readonly confirm = inject(ConfirmationService);

  readonly resources = FEES_RESOURCES;
  readonly frequencies = FEE_FREQUENCY_OPTIONS;

  rows: FeeStructure[] = [];
  heads: FeeHead[] = [];
  years: LookupOption[] = [];
  classes: LookupOption[] = [];
  loading = true;
  saving = false;
  error: string | null = null;
  dialogVisible = false;
  detailVisible = false;
  cloneVisible = false;
  step = 1;
  editing: FeeStructure | null = null;
  detail: FeeStructure | null = null;
  cloneSource: FeeStructure | null = null;
  defaultDueDay = 10;

  q = '';
  academicYearId: number | null = null;
  classId: number | null = null;
  status = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    academicYearId: [null as number | null, Validators.required],
    classId: [null as number | null, Validators.required],
    dueDay: [10, [Validators.required, Validators.min(1), Validators.max(28)]],
    status: ['ACTIVE' as FeeMasterStatus, Validators.required],
    items: this.fb.array([])
  });

  cloneForm = this.fb.group({
    targetAcademicYearId: [null as number | null, Validators.required],
    targetClassIds: [[] as number[]],
    onConflict: ['CANCEL_CLASS' as 'CANCEL_CLASS' | 'REPLACE_DEACTIVATE']
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/academic-years`)
      .pipe(map(r => r.data ?? []))
      .subscribe(years => {
        this.years = years;
        this.academicYearId = years[0]?.id ?? null;
        this.loadClasses();
        this.load();
      });
    this.api.headLookups().subscribe({ next: h => this.heads = h, error: () => this.heads = [] });
    this.api.getSettings().subscribe({
      next: s => { this.defaultDueDay = s.defaultDueDayForNewStructures ?? 10; },
      error: () => { /* GET must not create; missing config is ok for UI defaults */ }
    });
  }

  loadClasses(): void {
    this.http.get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/classes`)
      .pipe(map(r => r.data ?? []))
      .subscribe(classes => this.classes = classes);
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.listStructures({
      q: this.q || undefined,
      academicYearId: this.academicYearId ?? undefined,
      classId: this.classId ?? undefined,
      status: this.status || undefined
    }, this.page, this.size).pipe(finalizeBusy(v => (this.loading = v))).subscribe({
      next: page => {
        this.rows = page.content;
        this.total = page.totalElements;
      },
      error: err => {
        this.error = extractApiError(err, 'Request failed').message || 'Failed to load fee structures';
      }
    });
  }

  search(): void { this.page = 0; this.load(); }
  reset(): void {
    this.q = '';
    this.classId = null;
    this.status = '';
    this.page = 0;
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.step = 1;
    this.form.reset({
      name: '',
      academicYearId: this.academicYearId,
      classId: null,
      dueDay: this.defaultDueDay,
      status: 'ACTIVE'
    });
    this.items.clear();
    this.addItem();
    this.dialogVisible = true;
  }

  openEdit(row: FeeStructure): void {
    this.api.getStructure(row.feeStructureId).subscribe({
      next: detail => {
        this.editing = detail;
        this.step = 1;
        this.form.reset({
          name: detail.name,
          academicYearId: detail.academicYearId,
          classId: detail.classId,
          dueDay: detail.dueDay,
          status: detail.status
        });
        this.items.clear();
        (detail.items ?? []).forEach(it => this.items.push(this.itemGroup(it)));
        if (!this.items.length) this.addItem();
        this.dialogVisible = true;
      },
      error: err => this.feedback.error('Load failed', extractApiError(err, 'Request failed').message)
    });
  }

  openDetail(row: FeeStructure): void {
    this.api.getStructure(row.feeStructureId).subscribe({
      next: d => { this.detail = d; this.detailVisible = true; },
      error: err => this.feedback.error('Load failed', extractApiError(err, 'Request failed').message)
    });
  }

  openClone(row: FeeStructure): void {
    this.api.getStructure(row.feeStructureId).subscribe({
      next: d => {
        this.cloneSource = d;
        this.cloneForm.reset({
          targetAcademicYearId: d.academicYearId,
          targetClassIds: [],
          onConflict: 'CANCEL_CLASS'
        });
        this.cloneVisible = true;
      },
      error: err => this.feedback.error('Load failed', extractApiError(err, 'Request failed').message)
    });
  }

  itemGroup(it?: Partial<{ feeHeadId: number; amount: number; frequency: FeeFrequency; type: FeeItemType; serviceKey: FeeServiceKey }>) {
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

  nextStep(): void {
    if (this.step === 1) {
      ['name', 'academicYearId', 'classId', 'dueDay', 'status'].forEach(c => this.form.get(c)?.markAsTouched());
      if (this.form.get('name')?.invalid || this.form.get('academicYearId')?.invalid
        || this.form.get('classId')?.invalid || this.form.get('dueDay')?.invalid) return;
      this.step = 2;
      return;
    }
    if (this.step === 2) {
      this.items.controls.forEach(c => c.markAllAsTouched());
      if (this.items.invalid) return;
      const headIds = this.items.controls.map(c => c.value.feeHeadId);
      if (new Set(headIds).size !== headIds.length) {
        this.feedback.formError('Duplicate fee heads are not allowed in one structure.');
        return;
      }
      for (const c of this.items.controls) {
        const type = c.value.type as FeeItemType;
        const service = c.value.serviceKey as FeeServiceKey;
        if (type === 'MANDATORY' && service !== 'NONE') {
          this.feedback.formError('Mandatory items must use service NONE.');
          return;
        }
        if (type === 'OPTIONAL' && service === 'NONE') {
          this.feedback.formError('Optional items require TRANSPORT or HOSTEL.');
          return;
        }
      }
      this.step = 3;
    }
  }

  prevStep(): void {
    if (this.step > 1) this.step -= 1;
  }

  mandatorySum(): number {
    return this.items.controls
      .filter(c => c.value.type === 'MANDATORY')
      .reduce((s, c) => s + Number(c.value.amount || 0), 0);
  }

  optionalSum(): number {
    return this.items.controls
      .filter(c => c.value.type === 'OPTIONAL')
      .reduce((s, c) => s + Number(c.value.amount || 0), 0);
  }

  save(): void {
    if (this.form.invalid || this.items.length < 1) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      name: (raw.name ?? '').trim(),
      academicYearId: raw.academicYearId as number,
      classId: raw.classId as number,
      dueDay: Number(raw.dueDay),
      status: raw.status as FeeMasterStatus,
      items: this.items.controls.map(c => ({
        feeHeadId: c.value.feeHeadId as number,
        amount: Number(c.value.amount),
        frequency: c.value.frequency as FeeFrequency,
        type: c.value.type as FeeItemType,
        serviceKey: c.value.serviceKey as FeeServiceKey
      }))
    };
    this.saving = true;
    const req$ = this.editing
      ? this.api.updateStructure(this.editing.feeStructureId, body)
      : this.api.createStructure(body);
    req$.pipe(finalizeBusy(v => (this.saving = v))).subscribe({
      next: () => {
        this.dialogVisible = false;
        this.feedback.success(this.editing ? 'Structure updated' : 'Structure created', body.name);
        this.load();
      },
      error: err => {
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  saveClone(): void {
    if (!this.cloneSource || this.cloneForm.invalid) {
      this.cloneForm.markAllAsTouched();
      return;
    }
    const raw = this.cloneForm.getRawValue();
    const classIds = raw.targetClassIds ?? [];
    if (!classIds.length) {
      this.feedback.formError('Select at least one target class.');
      return;
    }
    this.saving = true;
    this.api.cloneStructure(this.cloneSource.feeStructureId, {
      targetAcademicYearId: raw.targetAcademicYearId as number,
      targets: classIds.map(classId => ({ classId })),
      onConflict: raw.onConflict as 'CANCEL_CLASS' | 'REPLACE_DEACTIVATE'
    }).pipe(finalizeBusy(v => (this.saving = v))).subscribe({
      next: () => {
        this.cloneVisible = false;
        this.feedback.success('Structures cloned', `${classIds.length} class(es)`);
        this.load();
      },
      error: err => {
        this.feedback.error('Clone failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  toggleStatus(row: FeeStructure): void {
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.confirm.confirm({
      message: `Set "${row.name}" to ${next}?`,
      header: 'Confirm',
      accept: () => {
        this.api.patchStructureStatus(row.feeStructureId, next).subscribe({
          next: () => { this.feedback.success('Status updated', row.name); this.load(); },
          error: err => this.feedback.error('Status change failed', extractApiError(err, 'Request failed').message)
        });
      }
    });
  }

  headName(id: number | null | undefined): string {
    return this.heads.find(h => h.feeHeadId === id)?.name ?? String(id ?? '');
  }
}
