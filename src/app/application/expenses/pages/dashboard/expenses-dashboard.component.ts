import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { SaasPageHeaderComponent, SaasPillComponent } from '../../../../shared/ui/saas';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpenseFormDrawerComponent } from '../../components/expense-form-drawer/expense-form-drawer.component';
import { ExpenseRejectDialogComponent } from '../../components/expense-reject-dialog/expense-reject-dialog.component';
import { RecordExpensePaymentDialogComponent } from '../../components/record-expense-payment-dialog/record-expense-payment-dialog.component';
import {
  EXPENSE_RESOURCES,
  ExpenseCategory,
  ExpenseDetail,
  ExpenseFilter,
  ExpenseHead,
  ExpenseListRow,
  ExpenseOverview,
  expenseStatusLabel,
  expenseStatusTone
} from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

@Component({
  selector: 'app-expenses-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppToastComponent,
    HasPermissionDirective,
    KpiCardComponent,
    KpiGroupComponent,
    SaasPageHeaderComponent,
    SaasPillComponent,
    TcPageSkeletonComponent,
    ExpenseFormDrawerComponent,
    ExpenseRejectDialogComponent,
    RecordExpensePaymentDialogComponent
  ],
  templateUrl: './expenses-dashboard.component.html',
  styleUrls: ['./expenses-dashboard.component.scss', '../../expenses.shared.scss']
})
export class ExpensesDashboardComponent implements OnInit {
  private readonly api = inject(ExpensesApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly resources = EXPENSE_RESOURCES;
  readonly approvalStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const;
  readonly paymentStatuses = ['UNPAID', 'PARTIALLY_PAID', 'PAID'] as const;

  kpis: ExpenseOverview | null = null;
  rows: ExpenseListRow[] = [];
  heads: ExpenseHead[] = [];
  categories: ExpenseCategory[] = [];
  loading = true;
  tableLoading = false;
  error: string | null = null;
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  sort = 'expenseDate,desc';
  drawer = false;
  editing: ExpenseDetail | null = null;
  payment = false;
  paymentExpense: ExpenseDetail | null = null;
  reject = false;
  rejectId: number | null = null;
  draft: ExpenseFilter = { datePreset: 'THIS_MONTH' };
  filter: ExpenseFilter = { datePreset: 'THIS_MONTH' };

  ngOnInit(): void {
    this.loadLookups();
    this.loadAll();
  }

  loadLookups(): void {
    forkJoin({ heads: this.api.headLookups(), categories: this.api.listCategories() }).subscribe({
      next: x => {
        this.heads = x.heads;
        this.categories = x.categories;
      },
      error: () => {
        this.heads = [];
        this.categories = [];
      }
    });
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;
    this.api.overview(this.filter).pipe(finalizeBusy(v => {
      this.loading = v;
      this.cdr.detectChanges();
    })).subscribe({
      next: k => {
        this.kpis = k;
        this.cdr.detectChanges();
        this.loadRows();
      },
      error: e => {
        this.error = extractApiError(e, 'Failed to load expenses').message;
        this.feedback.error('Expenses', this.error!);
        this.cdr.detectChanges();
      }
    });
  }

  loadRows(): void {
    this.tableLoading = true;
    this.api.list(this.filter, this.page, this.size, this.sort).pipe(finalizeBusy(v => {
      this.tableLoading = v;
      this.cdr.detectChanges();
    })).subscribe({
      next: p => {
        this.rows = p.content;
        this.total = p.totalElements;
        this.cdr.detectChanges();
      },
      error: e => {
        this.rows = [];
        this.total = 0;
        this.feedback.error('Expenses', extractApiError(e, 'Request failed').message);
      }
    });
  }

  apply(): void {
    this.filter = { ...this.draft, q: this.draft.q?.trim() || undefined };
    if (this.filter.datePreset !== 'CUSTOM') {
      delete this.filter.dateFrom;
      delete this.filter.dateTo;
    }
    this.page = 0;
    this.loadAll();
  }

  reset(): void {
    this.draft = { datePreset: 'THIS_MONTH' };
    this.apply();
  }

  openAdd(): void {
    this.editing = null;
    this.drawer = true;
  }

  edit(row: ExpenseListRow): void {
    this.api.get(row.expenseId).subscribe({
      next: e => {
        this.editing = e;
        this.drawer = true;
      },
      error: e => this.feedback.error('Expense', extractApiError(e, 'Request failed').message)
    });
  }

  pay(row: ExpenseListRow): void {
    this.api.get(row.expenseId).subscribe(e => {
      this.paymentExpense = e;
      this.payment = true;
    });
  }

  approve(row: ExpenseListRow): void {
    this.api.approve(row.expenseId).subscribe({
      next: () => {
        this.feedback.success('Expense approved', 'Expense is ready for payment.');
        this.loadAll();
      },
      error: e => this.feedback.error('Approve failed', extractApiError(e, 'Request failed').message)
    });
  }

  rejectExpense(row: ExpenseListRow): void {
    this.rejectId = row.expenseId;
    this.reject = true;
  }

  previous(): void {
    if (this.page > 0) {
      this.page--;
      this.loadRows();
    }
  }

  next(): void {
    if ((this.page + 1) * this.size < this.total) {
      this.page++;
      this.loadRows();
    }
  }

  changeSort(value: string): void {
    this.sort = value;
    this.page = 0;
    this.loadRows();
  }

  money(v?: number | null): string {
    return Number(v ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }

  label = expenseStatusLabel;
  tone = expenseStatusTone;
}
