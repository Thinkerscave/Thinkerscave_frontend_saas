import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
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
  template: `
    <p-dialog
      header="Manage Employee Salary"
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '780px', maxWidth: '96vw' }">
      <form [formGroup]="form" class="flex flex-column gap-3" (ngSubmit)="save()">
        <div class="grid">
          <div class="col-12 md:col-4">
            <label class="block mb-1">Payment Type *</label>
            <select class="p-inputtext p-component w-full" formControlName="paymentType">
              @for (o of paymentTypes; track o.value) {
                <option [value]="o.value">{{ o.label }}</option>
              }
            </select>
          </div>
          <div class="col-12 md:col-4">
            <label class="block mb-1">Apply structure</label>
            <select class="p-inputtext p-component w-full" formControlName="salaryStructureId" (change)="applyStructure()">
              <option [ngValue]="null">None / custom</option>
              @for (s of structures; track s.salaryStructureId) {
                <option [ngValue]="s.salaryStructureId">{{ s.name }}</option>
              }
            </select>
          </div>
          <div class="col-12 md:col-4">
            <label class="block mb-1">Effective From *</label>
            <input class="p-inputtext p-component w-full" type="date" formControlName="effectiveFrom" />
          </div>
        </div>

        <div class="flex justify-content-between align-items-center">
          <strong>Salary lines</strong>
          <button type="button" class="p-button p-button-outlined p-button-sm" (click)="addLine()">
            <i class="pi pi-plus mr-1"></i> Add line
          </button>
        </div>
        <div formArrayName="lines" class="flex flex-column gap-2">
          @for (ctrl of lines.controls; track $index; let i = $index) {
            <div class="grid align-items-end" [formGroupName]="i">
              <div class="col-12 md:col-4">
                <select class="p-inputtext p-component w-full" formControlName="salaryComponentId" (change)="onComponentChange(i)">
                  <option [ngValue]="null" disabled>Component</option>
                  @for (c of components; track c.salaryComponentId) {
                    <option [ngValue]="c.salaryComponentId">{{ c.name }}</option>
                  }
                </select>
              </div>
              <div class="col-6 md:col-3">
                <select class="p-inputtext p-component w-full" formControlName="calculationMethod">
                  @for (m of methods; track m) {
                    <option [value]="m">{{ methodLabels[m] }}</option>
                  }
                </select>
              </div>
              <div class="col-4 md:col-2">
                <input class="p-inputtext p-component w-full" type="number" step="0.01" formControlName="value" />
              </div>
              <div class="col-2 md:col-2">
                <label class="flex align-items-center gap-2">
                  <input type="checkbox" formControlName="applicable" /> Applicable
                </label>
              </div>
              <div class="col-12 md:col-1">
                <button type="button" class="p-button p-button-text p-button-danger p-button-sm" (click)="lines.removeAt(i)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label class="block mb-1">Bank name</label>
            <input class="p-inputtext p-component w-full" formControlName="bankName" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Account holder</label>
            <input class="p-inputtext p-component w-full" formControlName="accountHolderName" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Account number</label>
            <input class="p-inputtext p-component w-full" formControlName="accountNumber" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">IFSC</label>
            <input class="p-inputtext p-component w-full" formControlName="ifscCode" />
          </div>
          <div class="col-12">
            <label class="block mb-1">Remarks</label>
            <textarea class="p-inputtext p-component w-full" rows="2" formControlName="remarks"></textarea>
          </div>
        </div>

        <div class="flex justify-content-end gap-2">
          <button type="button" class="p-button p-button-outlined" (click)="close()" [disabled]="saving">Cancel</button>
          <button type="submit" class="p-button" [disabled]="saving || form.invalid || !staffId">
            @if (saving) { <i class="pi pi-spin pi-spinner mr-1"></i> }
            Save salary
          </button>
        </div>
      </form>
    </p-dialog>
  `
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
    this.api.saveEmployeeSalary(this.staffId, body).subscribe({
      next: () => {
        this.saving = false;
        this.feedback.success('Salary saved', 'Employee salary updated with new effective date.');
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
