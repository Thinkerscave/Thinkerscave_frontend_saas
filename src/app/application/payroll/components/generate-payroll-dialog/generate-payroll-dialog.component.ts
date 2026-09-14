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
  templateUrl: './generate-payroll-dialog.component.html',
  styleUrls: ['../../payroll.shared.scss', './generate-payroll-dialog.component.scss']
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
