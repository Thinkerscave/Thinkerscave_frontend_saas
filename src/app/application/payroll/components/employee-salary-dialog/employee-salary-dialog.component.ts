import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { finalizeBusy } from '../../../../shared/ui/loading';
import {
  CALC_METHOD_LABELS,
  CalculationMethod,
  EmployeeSalary,
  EmployeeSalaryRequest,
  PAYMENT_TYPE_OPTIONS,
  PaymentType,
  SalaryComponent,
  SalaryStructure
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-employee-salary-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule],
  templateUrl: './employee-salary-dialog.component.html',
  styleUrls: ['../../payroll.shared.scss', './employee-salary-dialog.component.scss']
})
export class EmployeeSalaryDialogComponent implements OnChanges {
  private readonly api = inject(PayrollApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);

  @Input() visible = false;
  @Input() staffId: number | null = null;
  @Input() current: EmployeeSalary | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  components: SalaryComponent[] = [];
  structures: SalaryStructure[] = [];
  saving = false;
  readonly paymentTypes = PAYMENT_TYPE_OPTIONS;
  readonly methods = Object.keys(CALC_METHOD_LABELS) as CalculationMethod[];
  readonly methodLabels = CALC_METHOD_LABELS;

  form = this.fb.group({
    paymentType: ['SALARY' as PaymentType, Validators.required],
    salaryStructureId: [null as number | null],
    effectiveFrom: ['', Validators.required],
    bankName: [''],
    accountHolderName: [''],
    accountNumber: [''],
    ifscCode: [''],
    remarks: [''],
    lines: this.fb.array([])
  });

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.api.componentLookups().subscribe({ next: rows => (this.components = rows), error: () => (this.components = []) });
      this.api.structureLookups().subscribe({ next: rows => (this.structures = rows), error: () => (this.structures = []) });
      this.lines.clear();
      const c = this.current;
      this.form.reset({
        paymentType: c?.paymentType ?? 'SALARY',
        salaryStructureId: c?.salaryStructureId ?? null,
        effectiveFrom: c?.effectiveFrom ?? new Date().toISOString().substring(0, 10),
        bankName: c?.bankName ?? '',
        accountHolderName: c?.accountHolderName ?? '',
        accountNumber: c?.accountNumber ?? '',
        ifscCode: c?.ifscCode ?? '',
        remarks: c?.remarks ?? ''
      });
      (c?.lines ?? []).forEach(line =>
        this.lines.push(
          this.fb.group({
            salaryComponentId: [line.salaryComponentId, Validators.required],
            componentType: [line.componentType],
            calculationMethod: [line.calculationMethod, Validators.required],
            value: [line.value, Validators.required],
            applicable: [line.applicable]
          })
        )
      );
      if (!this.lines.length) this.addLine();
    }
  }

  addLine(): void {
    this.lines.push(
      this.fb.group({
        salaryComponentId: [null as number | null, Validators.required],
        componentType: ['EARNING'],
        calculationMethod: ['FIXED_AMOUNT' as CalculationMethod, Validators.required],
        value: [0, Validators.required],
        applicable: [true]
      })
    );
  }

  onComponentChange(index: number): void {
    const group = this.lines.at(index);
    const id = Number(group.get('salaryComponentId')?.value);
    const comp = this.components.find(c => c.salaryComponentId === id);
    if (!comp) return;
    group.patchValue({
      componentType: comp.componentType,
      calculationMethod: comp.calculationMethod,
      value: comp.defaultValue ?? 0
    });
  }

  applyStructure(): void {
    const structureId = this.form.value.salaryStructureId;
    if (structureId == null) return;
    this.api.getStructure(structureId).subscribe({
      next: structure => {
        this.lines.clear();
        (structure.items ?? []).forEach(item => {
          const comp = this.components.find(c => c.salaryComponentId === item.salaryComponentId);
          this.lines.push(
            this.fb.group({
              salaryComponentId: [item.salaryComponentId, Validators.required],
              componentType: [comp?.componentType ?? item.componentType ?? 'EARNING'],
              calculationMethod: [item.calculationMethod, Validators.required],
              value: [item.value, Validators.required],
              applicable: [true]
            })
          );
        });
        if (!this.lines.length) this.addLine();
      },
      error: err => this.feedback.error('Structure load failed', extractApiError(err, 'Request failed').message)
    });
  }

  save(): void {
    if (this.form.invalid || this.staffId == null || !this.lines.length) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: EmployeeSalaryRequest = {
      paymentType: raw.paymentType as PaymentType,
      salaryStructureId: raw.salaryStructureId ?? null,
      effectiveFrom: raw.effectiveFrom!,
      bankName: (raw.bankName || '').trim() || null,
      accountHolderName: (raw.accountHolderName || '').trim() || null,
      accountNumber: (raw.accountNumber || '').trim() || null,
      ifscCode: (raw.ifscCode || '').trim() || null,
      remarks: (raw.remarks || '').trim() || null,
      lines: (raw.lines as {
        salaryComponentId: number;
        componentType: string;
        calculationMethod: CalculationMethod;
        value: number;
        applicable: boolean;
      }[]).map(l => {
        const comp = this.components.find(c => c.salaryComponentId === Number(l.salaryComponentId));
        return {
          salaryComponentId: Number(l.salaryComponentId),
          componentType: (comp?.componentType ?? l.componentType) as EmployeeSalaryRequest['lines'][number]['componentType'],
          calculationMethod: l.calculationMethod,
          value: Number(l.value),
          applicable: !!l.applicable
        };
      })
    };
    this.saving = true;
    this.api.saveEmployeeSalary(this.staffId, body).pipe(finalizeBusy(v => (this.saving = v))).subscribe({
      next: () => {
        this.feedback.success('Salary saved', 'Employee salary updated with new effective date.');
        this.saved.emit();
        this.close();
      },
      error: err => {
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
