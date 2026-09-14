import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { FeesApiService } from '../../../fees/services/fees-api.service';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpenseDetail, PaymentMethodOption } from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

@Component({
  selector: 'app-record-expense-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule],
  templateUrl: './record-expense-payment-dialog.component.html',
  styleUrls: ['./record-expense-payment-dialog.component.scss', '../../expenses.shared.scss']
})
export class RecordExpensePaymentDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ExpensesApiService);
  private readonly fees = inject(FeesApiService);
  private readonly feedback = inject(UiFeedbackService);

  @Input() visible = false;
  @Input() expense: ExpenseDetail | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() paid = new EventEmitter<void>();

  methods: PaymentMethodOption[] = [];
  saving = false;

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paidOn: [new Date().toISOString().slice(0, 10), Validators.required],
    paymentMethodId: [null as number | null],
    referenceNumber: [''],
    remarks: ['']
  });

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({
        amount: this.expense?.remainingAmount ?? null,
        paidOn: new Date().toISOString().slice(0, 10),
        paymentMethodId: null,
        referenceNumber: '',
        remarks: ''
      });
      this.fees.listPaymentMethods('ACTIVE').subscribe(m => (this.methods = m));
    }
  }

  submit(): void {
    if (this.form.invalid || !this.expense) return;
    const r = this.form.getRawValue();
    this.saving = true;
    this.api
      .recordPayment(
        this.expense.expenseId,
        {
          amount: Number(r.amount),
          paidOn: r.paidOn!,
          paymentMethodId: r.paymentMethodId,
          referenceNumber: r.referenceNumber?.trim() || null,
          remarks: r.remarks?.trim() || null
        },
        crypto.randomUUID()
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.feedback.success('Payment recorded', 'Expense payment saved.');
          this.paid.emit();
          this.visibleChange.emit(false);
        },
        error: e => {
          this.saving = false;
          this.feedback.error('Payment failed', extractApiError(e, 'Request failed').message);
        }
      });
  }

  money(v?: number | null): string {
    return Number(v ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }
}
