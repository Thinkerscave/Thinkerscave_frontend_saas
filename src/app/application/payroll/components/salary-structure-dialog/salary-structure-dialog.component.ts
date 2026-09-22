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
  PayrollMasterStatus,
  SalaryComponent,
  SalaryStructure,
  SalaryStructureRequest
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-salary-structure-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule],
  templateUrl: './salary-structure-dialog.component.html',
  styleUrls: ['../../payroll.shared.scss', './salary-structure-dialog.component.scss']
})
export class SalaryStructureDialogComponent implements OnChanges {
  private readonly api = inject(PayrollApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);

  @Input() visible = false;
  @Input() editing: SalaryStructure | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  components: SalaryComponent[] = [];
  saving = false;
  readonly methods = Object.keys(CALC_METHOD_LABELS) as CalculationMethod[];
  readonly methodLabels = CALC_METHOD_LABELS;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    applicableStaffType: [null as string | null],
    status: ['ACTIVE' as PayrollMasterStatus, Validators.required],
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.api.componentLookups().subscribe({
        next: rows => (this.components = rows),
        error: () => (this.components = [])
      });
      this.items.clear();
      if (this.editing) {
        this.form.patchValue({
          name: this.editing.name,
          description: this.editing.description ?? '',
          applicableStaffType: this.editing.applicableStaffType ?? null,
          status: this.editing.status
        });
        (this.editing.items ?? []).forEach(item =>
          this.items.push(
            this.fb.group({
              salaryComponentId: [item.salaryComponentId, Validators.required],
              calculationMethod: [item.calculationMethod, Validators.required],
              value: [item.value, [Validators.required]]
            })
          )
        );
        if (!this.items.length) this.addItem();
      } else {
        this.form.reset({ name: '', description: '', applicableStaffType: null, status: 'ACTIVE' });
        this.addItem();
      }
    }
  }

  addItem(): void {
    this.items.push(
      this.fb.group({
        salaryComponentId: [null as number | null, Validators.required],
        calculationMethod: ['FIXED_AMOUNT' as CalculationMethod, Validators.required],
        value: [0, Validators.required]
      })
    );
  }

  save(): void {
    if (this.form.invalid || !this.items.length) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: SalaryStructureRequest = {
      name: (raw.name ?? '').trim(),
      description: (raw.description ?? '').trim() || null,
      applicableStaffType: raw.applicableStaffType ?? null,
      status: raw.status as PayrollMasterStatus,
      items: (raw.items as { salaryComponentId: number; calculationMethod: CalculationMethod; value: number }[]).map(i => ({
        salaryComponentId: Number(i.salaryComponentId),
        calculationMethod: i.calculationMethod,
        value: Number(i.value)
      }))
    };
    this.saving = true;
    const req$ = this.editing
      ? this.api.updateStructure(this.editing.salaryStructureId, body)
      : this.api.createStructure(body);
    req$.pipe(finalizeBusy(v => (this.saving = v))).subscribe({
      next: () => {
        this.feedback.success(this.editing ? 'Structure updated' : 'Structure created', body.name);
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
