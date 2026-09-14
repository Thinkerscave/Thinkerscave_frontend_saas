import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import {
  EMPLOYMENT_CATEGORY_OPTIONS,
  GeneratePayrollRequest,
  GeneratePayrollResult,
  GenerateScopeType
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-generate-payroll-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule],
  template: `
    <p-dialog
      header="Generate Payroll"
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '720px', maxWidth: '96vw' }"
      (onHide)="reset()">
      @if (step === 1) {
        <form [formGroup]="form" class="flex flex-column gap-3" (ngSubmit)="goReview()">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label class="block mb-1">Payroll Month *</label>
              <input class="p-inputtext p-component w-full" type="month" formControlName="period" />
            </div>
            <div class="col-12 md:col-6">
              <label class="block mb-1">Scope *</label>
              <select class="p-inputtext p-component w-full" formControlName="scopeType">
                <option value="ALL">All employees</option>
                <option value="EMPLOYMENT_CATEGORY">By employment type</option>
                <option value="CUSTOM">Custom staff IDs</option>
              </select>
            </div>
          </div>

          @if (form.value.scopeType === 'EMPLOYMENT_CATEGORY') {
            <div>
              <label class="block mb-1">Employment types</label>
              <div class="flex flex-wrap gap-3">
                @for (c of categories; track c.value) {
                  <label class="flex align-items-center gap-2">
                    <input type="checkbox" [checked]="selectedCategories.has(c.value)" (change)="toggleCategory(c.value, $event)" />
                    {{ c.label }}
                  </label>
                }
              </div>
            </div>
          }

          @if (form.value.scopeType === 'CUSTOM') {
            <div>
              <label class="block mb-1">Staff IDs (comma-separated)</label>
              <input class="p-inputtext p-component w-full" formControlName="staffIdsRaw" placeholder="e.g. 12, 45, 78" />
            </div>
          }

          <div>
            <label class="block mb-1">Generation note</label>
            <textarea class="p-inputtext p-component w-full" rows="2" formControlName="notes" maxlength="500"></textarea>
          </div>

          <div>
            <label class="block mb-1">Optional LOP overrides</label>
            <div class="flex gap-2 mb-2">
              <input class="p-inputtext p-component" type="number" placeholder="Staff ID" [(ngModel)]="lopStaffId" [ngModelOptions]="{standalone: true}" />
              <input class="p-inputtext p-component" type="number" min="0" placeholder="LOP days" [(ngModel)]="lopDays" [ngModelOptions]="{standalone: true}" />
              <button type="button" class="p-button p-button-outlined p-button-sm" (click)="addLop()">Add</button>
            </div>
            @if (lopOverrides.length) {
              <ul class="list-none p-0 m-0">
                @for (row of lopOverrides; track row.staffId; let i = $index) {
                  <li class="flex justify-content-between py-1 border-bottom-1 surface-border">
                    <span>Staff #{{ row.staffId }} · {{ row.lopDays }} day(s)</span>
                    <button type="button" class="p-button p-button-text p-button-sm p-button-danger" (click)="lopOverrides.splice(i, 1)">Remove</button>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="flex justify-content-end gap-2">
            <button type="button" class="p-button p-button-outlined" (click)="close()">Cancel</button>
            <button type="submit" class="p-button" [disabled]="form.invalid">Review</button>
          </div>
        </form>
      } @else {
        <div class="flex flex-column gap-3">
          <p class="m-0 text-sm text-color-secondary">
            Confirm generation for <strong>{{ reviewLabel }}</strong>
            (scope: {{ form.value.scopeType }}).
          </p>
          @if (result?.skippedCount) {
            <div class="payroll-banner payroll-banner--warn">
              {{ result!.skippedCount }} employee(s) skipped (salary not configured).
            </div>
          }
          @if (result?.summary; as s) {
            <div class="grid">
              <div class="col-6 md:col-3"><span class="text-sm text-color-secondary">Employees</span><div class="font-medium">{{ s.totalEmployees ?? result?.generatedCount }}</div></div>
              <div class="col-6 md:col-3"><span class="text-sm text-color-secondary">Gross</span><div class="font-medium">{{ formatMoney(s.totalGross) }}</div></div>
              <div class="col-6 md:col-3"><span class="text-sm text-color-secondary">Deductions</span><div class="font-medium">{{ formatMoney(s.totalDeductions) }}</div></div>
              <div class="col-6 md:col-3"><span class="text-sm text-color-secondary">Net</span><div class="font-medium">{{ formatMoney(s.totalNet) }}</div></div>
            </div>
          } @else if (!result) {
            <p class="m-0 text-sm">Click Confirm Generate to create this month’s payroll run.</p>
          }
          <div class="flex justify-content-end gap-2">
            <button type="button" class="p-button p-button-outlined" (click)="step = 1" [disabled]="saving">Back</button>
            <button type="button" class="p-button" (click)="confirm()" [disabled]="saving">
              @if (saving) { <i class="pi pi-spin pi-spinner mr-1"></i> }
              Confirm Generate
            </button>
          </div>
        </div>
      }
    </p-dialog>
  `,
  styleUrls: ['../../payroll.shared.scss']
})
export class GeneratePayrollDialogComponent {
  private readonly api = inject(PayrollApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() generated = new EventEmitter<GeneratePayrollResult>();

  readonly categories = EMPLOYMENT_CATEGORY_OPTIONS;
  step: 1 | 2 = 1;
  saving = false;
  result: GeneratePayrollResult | null = null;
  selectedCategories = new Set<string>();
  lopOverrides: { staffId: number; lopDays: number }[] = [];
  lopStaffId: number | null = null;
  lopDays: number | null = null;

  form = this.fb.group({
    period: [this.defaultPeriod(), Validators.required],
    scopeType: ['ALL' as GenerateScopeType, Validators.required],
    notes: [''],
    staffIdsRaw: ['']
  });

  get reviewLabel(): string {
    const period = this.form.value.period || '';
    const [y, m] = period.split('-');
    return `${m || '—'}/${y || '—'}`;
  }

  defaultPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  toggleCategory(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedCategories.add(value);
    else this.selectedCategories.delete(value);
  }

  addLop(): void {
    if (this.lopStaffId == null || this.lopDays == null || this.lopDays < 0) return;
    const existing = this.lopOverrides.find(r => r.staffId === this.lopStaffId);
    if (existing) existing.lopDays = this.lopDays;
    else this.lopOverrides.push({ staffId: this.lopStaffId, lopDays: this.lopDays });
    this.lopStaffId = null;
    this.lopDays = null;
  }

  goReview(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.value.scopeType === 'EMPLOYMENT_CATEGORY' && !this.selectedCategories.size) {
      this.feedback.error('Scope required', 'Select at least one employment type.');
      return;
    }
    this.step = 2;
    this.result = null;
  }

  confirm(): void {
    const raw = this.form.getRawValue();
    const [y, m] = (raw.period || '').split('-').map(Number);
    const body: GeneratePayrollRequest = {
      year: y,
      month: m,
      notes: (raw.notes || '').trim() || null,
      scopeType: raw.scopeType as GenerateScopeType,
      lopOverrides: this.lopOverrides.length ? [...this.lopOverrides] : undefined
    };
    if (body.scopeType === 'EMPLOYMENT_CATEGORY') {
      body.employmentCategories = [...this.selectedCategories];
    }
    if (body.scopeType === 'CUSTOM') {
      body.staffIds = (raw.staffIdsRaw || '')
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => Number.isFinite(n) && n > 0);
      if (!body.staffIds.length) {
        this.feedback.error('Staff required', 'Enter at least one staff ID.');
        return;
      }
    }

    this.saving = true;
    const key = crypto.randomUUID();
    this.api.generateRun(body, key).subscribe({
      next: result => {
        this.saving = false;
        this.result = result;
        this.feedback.success('Payroll generated', `${result.generatedCount} employee(s) processed.`);
        this.generated.emit(result);
        if (!result.skippedCount) this.close();
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Generate failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  reset(): void {
    this.step = 1;
    this.saving = false;
    this.result = null;
    this.selectedCategories.clear();
    this.lopOverrides = [];
    this.form.reset({ period: this.defaultPeriod(), scopeType: 'ALL', notes: '', staffIdsRaw: '' });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.reset();
  }
}
