import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';
import { PermissionService } from '../../../../core/services/permission.service';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { DrawerFormComponent } from '../../../../shared/ui/drawer-form/drawer-form.component';
import { FeesApiService } from '../../../fees/services/fees-api.service';
import { StaffService } from '../../../staff/services/staff.service';
import {
  EXPENSE_RESOURCES,
  ExpenseDetail,
  ExpenseHead,
  ExpensePaymentRequest,
  ExpenseSettings,
  PaymentMethodOption
} from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

@Component({
  selector: 'app-expense-form-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DrawerFormComponent],
  templateUrl: './expense-form-drawer.component.html',
  styleUrls: ['./expense-form-drawer.component.scss', '../../expenses.shared.scss']
})
export class ExpenseFormDrawerComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ExpensesApiService);
  private readonly staffApi = inject(StaffService);
  private readonly feesApi = inject(FeesApiService);
  private readonly permissions = inject(PermissionService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly router = inject(Router);

  @Input() open = false;
  @Input() expense: ExpenseDetail | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  heads: ExpenseHead[] = [];
  staff: any[] = [];
  methods: PaymentMethodOption[] = [];
  settings: ExpenseSettings | null = null;
  files: File[] = [];
  saving = false;

  readonly form = this.fb.group({
    expenseHeadId: [null as number | null, Validators.required],
    expenseDate: [new Date().toISOString().slice(0, 10), Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    vendorName: [''],
    vendorInvoiceNumber: [''],
    requesterStaffId: [null as number | null, Validators.required],
    remarks: [''],
    recordNow: [false],
    paymentAmount: [null as number | null],
    paidOn: [new Date().toISOString().slice(0, 10)],
    paymentMethodId: [null as number | null],
    referenceNumber: [''],
    paymentRemarks: ['']
  });

  get selectedHead(): ExpenseHead | undefined {
    return this.heads.find(h => h.expenseHeadId === this.form.controls.expenseHeadId.value);
  }

  get approved(): boolean {
    return this.expense?.approvalStatus === 'APPROVED';
  }

  get canPay(): boolean {
    return this.permissions.canManage(EXPENSE_RESOURCES.PAYMENT);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.files = [];
      forkJoin({
        heads: this.api.headLookups(),
        settings: this.api.getSettings(),
        staff: this.staffApi.getStaffList({ page: 0, size: 200 }),
        methods: this.feesApi.listPaymentMethods('ACTIVE')
      }).subscribe(({ heads, settings, staff, methods }) => {
        this.heads = heads;
        this.settings = settings;
        this.staff = staff.content;
        this.methods = methods;
        const e = this.expense;
        this.form.reset({
          expenseHeadId: e?.expenseHeadId ?? null,
          expenseDate: e?.expenseDate ?? new Date().toISOString().slice(0, 10),
          amount: e?.amount ?? null,
          vendorName: e?.vendorName ?? '',
          vendorInvoiceNumber: e?.vendorInvoiceNumber ?? '',
          requesterStaffId: e?.requester?.staffId ?? null,
          remarks: e?.remarks ?? '',
          recordNow: false,
          paymentAmount: null,
          paidOn: new Date().toISOString().slice(0, 10),
          paymentMethodId: settings.defaultPaymentMethodId ?? null,
          referenceNumber: '',
          paymentRemarks: ''
        });
        if (this.approved) {
          this.form.controls.expenseHeadId.disable();
          this.form.controls.expenseDate.disable();
          this.form.controls.amount.disable();
        } else {
          this.form.controls.expenseHeadId.enable();
          this.form.controls.expenseDate.enable();
          this.form.controls.amount.enable();
        }
      });
    }
  }

  headChanged(): void {
    const h = this.selectedHead;
    if (!this.form.controls.requesterStaffId.value && h?.defaultRequesterStaffId) {
      this.form.controls.requesterStaffId.setValue(h.defaultRequesterStaffId);
    }
  }

  filesSelected(event: Event): void {
    this.files = Array.from((event.target as HTMLInputElement).files ?? []).filter(
      f => f.size <= 10 * 1024 * 1024
    );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const r = this.form.getRawValue();
    const initialPayment: ExpensePaymentRequest | null = r.recordNow
      ? {
          amount: Number(r.paymentAmount || r.amount),
          paidOn: r.paidOn!,
          paymentMethodId: r.paymentMethodId,
          referenceNumber: r.referenceNumber?.trim() || null,
          remarks: r.paymentRemarks?.trim() || null
        }
      : null;
    const body = {
      expenseHeadId: r.expenseHeadId!,
      expenseDate: r.expenseDate!,
      amount: Number(r.amount),
      vendorName: r.vendorName?.trim() || null,
      vendorInvoiceNumber: r.vendorInvoiceNumber?.trim() || null,
      requesterStaffId: r.requesterStaffId!,
      remarks: r.remarks?.trim() || null
    };
    this.saving = true;
    const request = this.expense
      ? this.api.update(this.expense.expenseId, body)
      : this.api.create(
          { ...body, saveAsDraft: false, initialPayment },
          initialPayment ? crypto.randomUUID() : undefined
        );
    request.subscribe({
      next: detail => {
        const uploads = this.files.length
          ? forkJoin(this.files.map(f => this.api.uploadAttachment(detail.expenseId, f)))
          : of([]);
        uploads.subscribe({
          next: () => {
            this.saving = false;
            this.feedback.success(
              'Expense saved',
              `Expense ${detail.expenseNumber} ${this.expense ? 'updated' : 'created'} successfully.`
            );
            this.saved.emit();
            this.close();
            if (!this.expense) {
              this.router.navigate(['/app/expenses', detail.expenseId]);
            }
          },
          error: err => {
            this.saving = false;
            this.feedback.error(
              'Attachment upload failed',
              extractApiError(err, 'Expense saved, but attachment upload failed.').message
            );
          }
        });
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  close(): void {
    this.openChange.emit(false);
  }
}
