import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
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
  template: `
    <p-dialog
      [header]="editing ? 'Edit Salary Structure' : 'Add Salary Structure'"
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '720px', maxWidth: '96vw' }">
      <form [formGroup]="form" class="flex flex-column gap-3" (ngSubmit)="save()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label class="block mb-1">Name *</label>
            <input class="p-inputtext p-component w-full" formControlName="name" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Applicable staff type</label>
            <select class="p-inputtext p-component w-full" formControlName="applicableStaffType">
              <option [ngValue]="null">All</option>
              <option value="TEACHING">Teaching</option>
              <option value="NON_TEACHING">Non-teaching</option>
            </select>
          </div>
          <div class="col-12">
            <label class="block mb-1">Description</label>
            <textarea class="p-inputtext p-component w-full" rows="2" formControlName="description"></textarea>
          </div>
          <div class="col-12">
            <label class="block mb-1">Status *</label>
            <div class="flex gap-3">
              <label><input type="radio" formControlName="status" value="ACTIVE" /> Active</label>
              <label><input type="radio" formControlName="status" value="INACTIVE" /> Inactive</label>
            </div>
          </div>
        </div>

        <div class="flex justify-content-between align-items-center">
          <strong>Structure items</strong>
          <button type="button" class="p-button p-button-outlined p-button-sm" (click)="addItem()">
            <i class="pi pi-plus mr-1"></i> Add line
          </button>
        </div>
        <div formArrayName="items" class="flex flex-column gap-2">
          @for (ctrl of items.controls; track $index; let i = $index) {
            <div class="grid align-items-end" [formGroupName]="i">
              <div class="col-12 md:col-5">
                <label class="block mb-1">Component</label>
                <select class="p-inputtext p-component w-full" formControlName="salaryComponentId">
                  <option [ngValue]="null" disabled>Select</option>
                  @for (c of components; track c.salaryComponentId) {
                    <option [ngValue]="c.salaryComponentId">{{ c.name }} ({{ c.code }})</option>
                  }
                </select>
              </div>
              <div class="col-12 md:col-3">
                <label class="block mb-1">Method</label>
                <select class="p-inputtext p-component w-full" formControlName="calculationMethod">
                  @for (m of methods; track m) {
                    <option [value]="m">{{ methodLabels[m] }}</option>
                  }
                </select>
              </div>
              <div class="col-8 md:col-3">
                <label class="block mb-1">Value</label>
                <input class="p-inputtext p-component w-full" type="number" step="0.01" formControlName="value" />
              </div>
              <div class="col-4 md:col-1">
                <button type="button" class="p-button p-button-text p-button-danger p-button-sm" (click)="items.removeAt(i)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          }
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
    req$.subscribe({
      next: () => {
        this.saving = false;
        this.feedback.success(this.editing ? 'Structure updated' : 'Structure created', body.name);
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
