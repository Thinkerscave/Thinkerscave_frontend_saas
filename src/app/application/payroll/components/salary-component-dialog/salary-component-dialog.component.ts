import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import {
  CALC_METHOD_LABELS,
  CalculationMethod,
  COMPONENT_TYPE_LABELS,
  PayrollMasterStatus,
  SalaryComponent,
  SalaryComponentRequest,
  SalaryComponentType,
  StatutoryCode
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-salary-component-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule],
  template: `
    <p-dialog
      [header]="editing ? 'Edit Salary Component' : 'Add Salary Component'"
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '560px', maxWidth: '95vw' }">
      <form [formGroup]="form" class="flex flex-column gap-3" (ngSubmit)="save()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label class="block mb-1">Code *</label>
            <input class="p-inputtext p-component w-full" formControlName="code" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Name *</label>
            <input class="p-inputtext p-component w-full" formControlName="name" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Type *</label>
            <select class="p-inputtext p-component w-full" formControlName="componentType">
              @for (t of types; track t) {
                <option [value]="t">{{ typeLabels[t] }}</option>
              }
            </select>
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Calculation *</label>
            <select class="p-inputtext p-component w-full" formControlName="calculationMethod">
              @for (m of methods; track m) {
                <option [value]="m">{{ methodLabels[m] }}</option>
              }
            </select>
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Default value</label>
            <input class="p-inputtext p-component w-full" type="number" step="0.01" formControlName="defaultValue" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Statutory</label>
            <select class="p-inputtext p-component w-full" formControlName="statutoryCode">
              <option [ngValue]="null">None</option>
              <option value="PF">PF</option>
              <option value="ESI">ESI</option>
              <option value="PT">PT</option>
              <option value="TDS">TDS</option>
            </select>
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Sort order</label>
            <input class="p-inputtext p-component w-full" type="number" formControlName="sortOrder" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Status *</label>
            <div class="flex gap-3 mt-2">
              <label><input type="radio" formControlName="status" value="ACTIVE" /> Active</label>
              <label><input type="radio" formControlName="status" value="INACTIVE" /> Inactive</label>
            </div>
          </div>
        </div>
        <div class="flex justify-content-end gap-2">
          <button type="button" class="p-button p-button-outlined" (click)="close()" [disabled]="saving">Cancel</button>
          <button type="submit" class="p-button" [disabled]="saving || form.invalid">
            @if (saving) { <i class="pi pi-spin pi-spinner mr-1"></i> }
            Save
          </button>
        </div>
      </form>
    </p-dialog>
  `
})
export class SalaryComponentDialogComponent implements OnChanges {
  private readonly api = inject(PayrollApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);

  @Input() visible = false;
  @Input() editing: SalaryComponent | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  readonly types = Object.keys(COMPONENT_TYPE_LABELS) as SalaryComponentType[];
  readonly methods = Object.keys(CALC_METHOD_LABELS) as CalculationMethod[];
  readonly typeLabels = COMPONENT_TYPE_LABELS;
  readonly methodLabels = CALC_METHOD_LABELS;
  saving = false;

  form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(40)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    componentType: ['EARNING' as SalaryComponentType, Validators.required],
    calculationMethod: ['FIXED_AMOUNT' as CalculationMethod, Validators.required],
    defaultValue: [null as number | null],
    statutoryCode: [null as StatutoryCode | null],
    sortOrder: [0],
    status: ['ACTIVE' as PayrollMasterStatus, Validators.required]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.editing) {
        this.form.reset({
          code: this.editing.code,
          name: this.editing.name,
          componentType: this.editing.componentType,
          calculationMethod: this.editing.calculationMethod,
          defaultValue: this.editing.defaultValue ?? null,
          statutoryCode: this.editing.statutoryCode ?? null,
          sortOrder: this.editing.sortOrder ?? 0,
          status: this.editing.status
        });
      } else {
        this.form.reset({
          code: '',
          name: '',
          componentType: 'EARNING',
          calculationMethod: 'FIXED_AMOUNT',
          defaultValue: null,
          statutoryCode: null,
          sortOrder: 0,
          status: 'ACTIVE'
        });
      }
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: SalaryComponentRequest = {
      code: (raw.code ?? '').trim().toUpperCase(),
      name: (raw.name ?? '').trim(),
      componentType: raw.componentType as SalaryComponentType,
      calculationMethod: raw.calculationMethod as CalculationMethod,
      defaultValue: raw.defaultValue == null || raw.defaultValue === ('' as unknown) ? null : Number(raw.defaultValue),
      statutoryCode: raw.statutoryCode ?? null,
      sortOrder: Number(raw.sortOrder ?? 0),
      status: raw.status as PayrollMasterStatus
    };
    this.saving = true;
    const req$ = this.editing
      ? this.api.updateComponent(this.editing.salaryComponentId, body)
      : this.api.createComponent(body);
    req$.subscribe({
      next: () => {
        this.saving = false;
        this.feedback.success(this.editing ? 'Component updated' : 'Component created', body.name);
        this.saved.emit();
        this.close();
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
