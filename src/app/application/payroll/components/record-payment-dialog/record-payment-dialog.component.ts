import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { environment } from '../../../../../environments/environment';
import { PaymentMethodOption, PayrollEmployeeListItem, RecordPaymentRequest } from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-record-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule],
  template: `
    <p-dialog
      header="Record Payment"
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '540px', maxWidth: '95vw' }"
      (onHide)="visibleChange.emit(false)">
      @if (employee) {
        <div class="mb-3 p-2 surface-100 border-round">
          <strong>{{ employee.employeeName }}</strong>
          <div class="text-sm text-color-secondary">
            Net {{ formatMoney(employee.netAmount) }}
            @if (remaining != null) { · Remaining {{ formatMoney(remaining) }} }
          </div>
        </div>
      }
      <form [formGroup]="form" class="flex flex-column gap-3" (ngSubmit)="submit()">
        <div>
          <label class="block mb-1">Amount *</label>
          <input class="p-inputtext p-component w-full" type="number" min="0.01" step="0.01" formControlName="amount" />
        </div>
        <div>
          <label class="block mb-1">Paid On *</label>
          <input class="p-inputtext p-component w-full" type="datetime-local" formControlName="paidOn" />
        </div>
        <div>
          <label class="block mb-1">Payment Method *</label>
          <select class="p-inputtext p-component w-full" formControlName="paymentMethodId">
            <option [ngValue]="null" disabled>Select method</option>
            @for (m of methods; track m.feePaymentMethodId) {
              <option [ngValue]="m.feePaymentMethodId">{{ m.name }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block mb-1">Reference</label>
          <input class="p-inputtext p-component w-full" formControlName="reference" />
        </div>
        <div>
          <label class="block mb-1">Remarks</label>
          <textarea class="p-inputtext p-component w-full" rows="2" formControlName="remarks"></textarea>
        </div>
        <div class="flex justify-content-end gap-2">
          <button type="button" class="p-button p-button-outlined" (click)="close()" [disabled]="saving">Cancel</button>
          <button type="submit" class="p-button" [disabled]="saving || form.invalid || !employeePayrollId">
            @if (saving) { <i class="pi pi-spin pi-spinner mr-1"></i> }
            Record Payment
          </button>
        </div>
      </form>
    </p-dialog>
  `
})
export class RecordPaymentDialogComponent implements OnChanges {
  private readonly api = inject(PayrollApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);
  private readonly http = inject(HttpClient);

  @Input() visible = false;
  @Input() employee: PayrollEmployeeListItem | null = null;
  @Input() employeePayrollId: number | null = null;
  @Input() remaining: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() paid = new EventEmitter<void>();

  methods: PaymentMethodOption[] = [];
  saving = false;

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paidOn: [this.nowLocal(), Validators.required],
    paymentMethodId: [null as number | null, Validators.required],
    reference: [''],
    remarks: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.loadMethods();
      const defaultAmount = this.remaining ?? this.employee?.netAmount ?? null;
      this.form.reset({
        amount: defaultAmount,
        paidOn: this.nowLocal(),
        paymentMethodId: null,
        reference: '',
        remarks: ''
      });
    }
  }

  private loadMethods(): void {
    this.http
      .get<{ success: boolean; data: PaymentMethodOption[] | { content: PaymentMethodOption[] } }>(
        `${environment.baseUrl}/fees/payment-methods`
      )
      .pipe(
        map(r => {
          const data = r.data;
          return Array.isArray(data) ? data : (data?.content ?? []);
        })
      )
      .subscribe({
        next: methods => (this.methods = methods.filter(m => !m.status || m.status === 'ACTIVE')),
        error: () => (this.methods = [])
      });
  }

  private nowLocal(): string {
    const d = new Date();
    d.setSeconds(0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  submit(): void {
    if (this.form.invalid || this.employeePayrollId == null) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: RecordPaymentRequest = {
      amount: Number(raw.amount),
      paidOn: raw.paidOn!,
      paymentMethodId: raw.paymentMethodId,
      reference: (raw.reference || '').trim() || null,
      remarks: (raw.remarks || '').trim() || null
    };
    this.saving = true;
    this.api.recordPayment(this.employeePayrollId, body, crypto.randomUUID()).subscribe({
      next: () => {
        this.saving = false;
        this.feedback.success('Payment recorded', 'Employee payroll updated.');
        this.paid.emit();
        this.close();
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Payment failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
