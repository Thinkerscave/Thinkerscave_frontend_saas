import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { EmployeeSalaryDialogComponent } from '../../components/employee-salary-dialog/employee-salary-dialog.component';
import {
  EmployeePayrollDetail,
  EmployeeSalary,
  PAYROLL_RESOURCES,
  monthLabel,
  payrollStatusLabel,
  payrollStatusTone
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

type SalaryTab = 'current' | 'statutory' | 'salaryHistory' | 'payrollHistory';

@Component({
  selector: 'app-employee-salary-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HasPermissionDirective,
    AppToastComponent,
    SaasPageHeaderComponent,
    EmployeeSalaryDialogComponent
  ],
  templateUrl: './employee-salary-page.component.html',
  styleUrls: ['../../payroll.shared.scss']
})
export class EmployeeSalaryPageComponent implements OnInit {
  private readonly api = inject(PayrollApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = PAYROLL_RESOURCES;
  staffId = 0;
  activeTab: SalaryTab = 'current';
  salary: EmployeeSalary | null = null;
  history: EmployeeSalary[] = [];
  payrollHistory: EmployeePayrollDetail[] = [];
  loading = true;
  error: string | null = null;
  dialogVisible = false;

  ngOnInit(): void {
    this.staffId = Number(this.route.snapshot.paramMap.get('staffId'));
    this.load();
  }

  load(): void {
    if (!this.staffId) {
      this.error = 'Invalid staff id';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = null;
    this.api
      .getEmployeeSalary(this.staffId)
      .pipe(
        catchError(err => {
          if (err?.status === 404) return of(null);
          throw err;
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: salary => {
          this.salary = salary;
          this.loadHistory();
          this.loadPayrollHistory();
        },
        error: err => {
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load employee salary';
        }
      });
  }

  loadHistory(): void {
    this.api
      .employeeSalaryHistory(this.staffId)
      .pipe(catchError(() => of([] as EmployeeSalary[])))
      .subscribe(rows => (this.history = rows));
  }

  loadPayrollHistory(): void {
    this.api
      .employeePayrollHistory(this.staffId, 0, 50)
      .pipe(catchError(() => of({ content: [] as EmployeePayrollDetail[], totalElements: 0, totalPages: 0, number: 0, size: 50 })))
      .subscribe(page => (this.payrollHistory = page.content));
  }

  openEdit(): void {
    this.dialogVisible = true;
  }

  formatMoney(v: number | null | undefined): string {
    if (v == null) return '—';
    return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  monthLabel = monthLabel;
  statusLabel = payrollStatusLabel;
  statusTone = payrollStatusTone;
}
