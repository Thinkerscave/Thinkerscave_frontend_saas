import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { SaasPageHeaderComponent, SaasPillComponent } from '../../../../shared/ui/saas';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpenseHeadDialogComponent } from '../../components/expense-head-dialog/expense-head-dialog.component';
import { EXPENSE_RESOURCES, ExpenseCategory, ExpenseHead } from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

@Component({
  selector: 'app-expense-heads-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppToastComponent,
    HasPermissionDirective,
    SaasPageHeaderComponent,
    SaasPillComponent,
    TcPageSkeletonComponent,
    ExpenseHeadDialogComponent
  ],
  templateUrl: './expense-heads-page.component.html',
  styleUrls: ['./expense-heads-page.component.scss', '../../expenses.shared.scss']
})
export class ExpenseHeadsPageComponent implements OnInit {
  private readonly api = inject(ExpensesApiService);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = EXPENSE_RESOURCES;
  rows: ExpenseHead[] = [];
  categories: ExpenseCategory[] = [];
  loading = true;
  draftQ = '';
  q = '';
  categoryId: number | null = null;
  status = '';
  dialog = false;
  selected: ExpenseHead | null = null;

  get filtered(): ExpenseHead[] {
    return this.rows.filter(
      h =>
        (!this.categoryId || h.category.expenseCategoryId === this.categoryId) &&
        (!this.status || h.status === this.status)
    );
  }

  ngOnInit(): void {
    this.api.listCategories().subscribe(c => (this.categories = c));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.listHeads(this.q, 0, 200).pipe(finalizeBusy(v => (this.loading = v))).subscribe({
      next: p => {
        this.rows = p.content;
      },
      error: e => {
        this.feedback.error('Expense heads', extractApiError(e, 'Request failed').message);
      }
    });
  }

  apply(): void {
    this.q = this.draftQ.trim();
    this.load();
  }

  reset(): void {
    this.draftQ = '';
    this.q = '';
    this.categoryId = null;
    this.status = '';
    this.load();
  }

  open(h: ExpenseHead | null): void {
    this.selected = h;
    this.dialog = true;
  }

  toggle(h: ExpenseHead): void {
    this.api.patchHeadStatus(h.expenseHeadId, h.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE').subscribe({
      next: () => this.load(),
      error: e => this.feedback.error('Update failed', extractApiError(e, 'Request failed').message)
    });
  }
}
