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
  templateUrl: './salary-component-dialog.component.html',
  styleUrls: ['../../payroll.shared.scss', './salary-component-dialog.component.scss']
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
