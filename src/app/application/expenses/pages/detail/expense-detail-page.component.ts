import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { SaasPageHeaderComponent, SaasPillComponent } from '../../../../shared/ui/saas';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpenseFormDrawerComponent } from '../../components/expense-form-drawer/expense-form-drawer.component';
import { ExpenseRejectDialogComponent } from '../../components/expense-reject-dialog/expense-reject-dialog.component';
import { RecordExpensePaymentDialogComponent } from '../../components/record-expense-payment-dialog/record-expense-payment-dialog.component';
import {
  EXPENSE_RESOURCES,
  ExpenseDetail,
  expenseStatusLabel,
  expenseStatusTone
} from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

type Tab = 'details' | 'payments' | 'approvals' | 'attachments' | 'activity';

@Component({
  selector: 'app-expense-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AppToastComponent,
    HasPermissionDirective,
    SaasPageHeaderComponent,
    SaasPillComponent,
    ExpenseFormDrawerComponent,
    ExpenseRejectDialogComponent,
    RecordExpensePaymentDialogComponent
  ],
  templateUrl: './expense-detail-page.component.html',
  styleUrls: ['./expense-detail-page.component.scss', '../../expenses.shared.scss']
})
export class ExpenseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ExpensesApiService);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = EXPENSE_RESOURCES;
  readonly tabs: Tab[] = ['details', 'payments', 'approvals', 'attachments', 'activity'];
  tab: Tab = 'details';
  expense: ExpenseDetail | null = null;
  loading = true;
  drawer = false;
  payment = false;
  reject = false;

  get id(): number {
    return Number(this.route.snapshot.paramMap.get('expenseId'));
  }

  get activity(): { label: string; when: string; detail: string }[] {
    if (!this.expense) return [];
    return [
      ...this.expense.approvalEvents.map(a => ({
        label: this.label(a.eventType),
        when: a.occurredOn || '',
        detail: a.remarks || a.actor || ''
      })),
      ...this.expense.payments.map(p => ({
        label: 'Payment Recorded',
        when: p.createdOn || p.paidOn,
        detail: this.money(p.amount)
      })),
      ...this.expense.attachments.map(a => ({
        label: 'Attachment Uploaded',
        when: a.uploadedOn || '',
        detail: a.fileName
      }))
    ].sort((a, b) => b.when.localeCompare(a.when));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get(this.id).subscribe({
      next: e => {
        this.expense = e;
        this.loading = false;
      },
      error: e => {
        this.loading = false;
        this.feedback.error('Expense', extractApiError(e, 'Request failed').message);
      }
    });
  }

  submit(): void {
    this.api.submit(this.id).subscribe({
      next: () => this.load(),
      error: e => this.feedback.error('Submit failed', extractApiError(e, 'Request failed').message)
    });
  }

  approve(): void {
    this.api.approve(this.id).subscribe({
      next: () => this.load(),
      error: e => this.feedback.error('Approve failed', extractApiError(e, 'Request failed').message)
    });
  }

  returnToDraft(): void {
    this.api.returnToDraft(this.id).subscribe({
      next: () => {
        this.feedback.success('Returned to draft', 'Expense can be corrected and resubmitted.');
        this.load();
      },
      error: e => this.feedback.error('Return failed', extractApiError(e, 'Request failed').message)
    });
  }

  upload(event: Event): void {
    const f = (event.target as HTMLInputElement).files?.[0];
    if (f) {
      this.api.uploadAttachment(this.id, f).subscribe({
        next: () => this.load(),
        error: e => this.feedback.error('Upload failed', extractApiError(e, 'Request failed').message)
      });
    }
  }

  download(documentId: number, name: string): void {
    this.api.downloadAttachment(this.id, documentId).subscribe(b => {
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u;
      a.download = name;
      a.click();
      URL.revokeObjectURL(u);
    });
  }

  remove(documentId: number): void {
    this.api.deleteAttachment(this.id, documentId).subscribe(() => this.load());
  }

  money(v?: number | null): string {
    return Number(v ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }

  label = expenseStatusLabel;
  tone = expenseStatusTone;
}
