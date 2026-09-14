import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { GeneratePayrollDialogComponent } from '../../components/generate-payroll-dialog/generate-payroll-dialog.component';
import { RecordPaymentDialogComponent } from '../../components/record-payment-dialog/record-payment-dialog.component';
import {
  EMPLOYMENT_CATEGORY_OPTIONS,
  EMPLOYEE_PAYROLL_STATUS_LABELS,
  EmployeePayrollStatus,
  PAYMENT_TYPE_OPTIONS,
  PAYROLL_RESOURCES,
  PayrollActivityItem,
  PayrollEmployeeListItem,
  PayrollOverviewKpis,
  payrollStatusLabel,
  payrollStatusTone
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HasPermissionDirective,
    AppToastComponent,
    KpiCardComponent,
    KpiGroupComponent,
    SaasPageHeaderComponent,
    GeneratePayrollDialogComponent,
    RecordPaymentDialogComponent
  ],
  templateUrl: './payroll-dashboard.component.html',
  styleUrls: ['../../payroll.shared.scss']
})
export class PayrollDashboardComponent implements OnInit {
  private readonly api = inject(PayrollApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly resources = PAYROLL_RESOURCES;
  readonly employmentOptions = EMPLOYMENT_CATEGORY_OPTIONS;
  readonly paymentTypes = PAYMENT_TYPE_OPTIONS;
  readonly statusOptions = Object.keys(EMPLOYEE_PAYROLL_STATUS_LABELS) as EmployeePayrollStatus[];

  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  draftEmploymentCategory = '';
  draftPaymentType = '';
  draftStatus = '';
  draftQ = '';
  employmentCategory = '';
  paymentType = '';
  status = '';
  q = '';

  kpis: PayrollOverviewKpis | null = null;
  rows: PayrollEmployeeListItem[] = [];
  activities: PayrollActivityItem[] = [];
  loading = true;
  tableLoading = false;
  error: string | null = null;
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;

  generateVisible = false;
  paymentVisible = false;
  paymentEmployee: PayrollEmployeeListItem | null = null;

  ngOnInit(): void {
    this.loadAll();
  }

  get periodValue(): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}`;
  }

  set periodValue(value: string) {
    const [y, m] = (value || '').split('-').map(Number);
    if (y && m) {
      this.year = y;
      this.month = m;
    }
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;
    this.api.overview(this.year, this.month)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
      next: kpis => {
        this.kpis = kpis;
        this.loadEmployees();
        this.loadActivities();
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = extractApiError(err, 'Failed to load payroll overview').message;
        this.feedback.error('Payroll', this.error);
        this.cdr.markForCheck();
      }
    });
  }

  loadEmployees(): void {
    this.tableLoading = true;
    this.api
      .listEmployees(
        {
          year: this.year,
          month: this.month,
          employmentCategory: this.employmentCategory || undefined,
          paymentType: this.paymentType || undefined,
          status: this.status || undefined,
          q: this.q || undefined
        },
        this.page,
        this.size
      )
      .pipe(finalize(() => {
        this.tableLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: page => {
          this.rows = page.content;
          this.total = page.totalElements;
          this.cdr.markForCheck();
        },
        error: err => {
          this.feedback.error('Employees', extractApiError(err, 'Request failed').message);
          this.rows = [];
          this.total = 0;
          this.cdr.markForCheck();
        }
      });
  }

  loadActivities(): void {
    this.api
      .recentActivities(0, 8)
      .pipe(catchError(() => of([] as PayrollActivityItem[])))
      .subscribe(rows => {
        this.activities = rows;
        this.cdr.markForCheck();
      });
  }

  onPeriodChange(): void {
    this.page = 0;
    this.loadAll();
  }

  search(): void {
    this.employmentCategory = this.draftEmploymentCategory;
    this.paymentType = this.draftPaymentType;
    this.status = this.draftStatus;
    this.q = this.draftQ.trim();
    this.page = 0;
    this.loadEmployees();
  }

  resetFilters(): void {
    this.draftEmploymentCategory = '';
    this.draftPaymentType = '';
    this.draftStatus = '';
    this.draftQ = '';
    this.employmentCategory = '';
    this.paymentType = '';
    this.status = '';
    this.q = '';
    this.page = 0;
    this.loadEmployees();
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.loadEmployees();
  }

  nextPage(): void {
    if ((this.page + 1) * this.size >= this.total) return;
    this.page += 1;
    this.loadEmployees();
  }

  openGenerate(): void {
    this.generateVisible = true;
  }

  onGenerated(): void {
    this.loadAll();
  }

  openPayment(row: PayrollEmployeeListItem): void {
    if (!row.employeePayrollId) return;
    this.paymentEmployee = row;
    this.paymentVisible = true;
  }

  onPaid(): void {
    this.loadAll();
  }

  paymentPendingCount(kpis: PayrollOverviewKpis): number {
    if (kpis.paymentPending != null) {
      return Number(kpis.paymentPending);
    }
    return Number(kpis.approvedCount ?? 0) + Number(kpis.partiallyPaidCount ?? 0);
  }

  downloadPayslip(row: PayrollEmployeeListItem): void {
    if (!row.employeePayrollId || !row.payslipDocumentId) {
      this.feedback.error('Payslip not available', 'No stored payslip for this employee.');
      return;
    }
    this.api.downloadPayslip(row.employeePayrollId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip-${row.employeeCode || row.staffId}-${this.year}-${this.month}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => this.feedback.error('Download failed', extractApiError(err, 'Request failed').message)
    });
  }

  canRecordPayment(row: PayrollEmployeeListItem): boolean {
    return !!row.employeePayrollId && (row.status === 'APPROVED' || row.status === 'PARTIALLY_PAID');
  }

  formatMoney(v: number | null | undefined): string {
    if (v == null) return '—';
    return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  statusLabel = payrollStatusLabel;
  statusTone = payrollStatusTone;
}
