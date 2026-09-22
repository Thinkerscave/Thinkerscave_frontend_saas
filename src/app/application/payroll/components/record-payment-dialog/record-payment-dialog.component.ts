import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { finalizeBusy } from '../../../../shared/ui/loading';
import { environment } from '../../../../../environments/environment';
import { PaymentMethodOption, PayrollEmployeeListItem, RecordPaymentRequest } from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-record-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule],
  templateUrl: './record-payment-dialog.component.html',
  styleUrls: ['../../payroll.shared.scss', './record-payment-dialog.component.scss']
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
    this.api.recordPayment(this.employeePayrollId, body, crypto.randomUUID())
      .pipe(finalizeBusy(v => (this.saving = v)))
      .subscribe({
      next: () => {
        this.feedback.success('Payment recorded', 'Employee payroll updated.');
        this.paid.emit();
        this.close();
      },
      error: err => {
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
