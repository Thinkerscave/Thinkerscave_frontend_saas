import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import {
  EmployeePayrollDetail,
  EmployeePayrollStatus,
  MyPayrollHistoryItem,
  MyPayrollSummary,
  PAYROLL_RESOURCES,
  monthLabel,
  payrollStatusLabel,
  payrollStatusTone
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

interface PayslipListItem {
  employeePayrollId: number;
  year: number;
  month: number;
  payslipNumber?: string | null;
}

@Component({
  selector: 'app-staff-my-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, HasPermissionDirective, AppToastComponent, SaasPageHeaderComponent, TcPageSkeletonComponent],
  templateUrl: './staff-my-payroll.component.html',
  styleUrls: ['../../payroll.shared.scss', './staff-my-payroll.component.scss']
})
export class StaffMyPayrollComponent implements OnInit {
  private readonly api = inject(PayrollApiService);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = PAYROLL_RESOURCES;
  summary: MyPayrollSummary | null = null;
  history: MyPayrollHistoryItem[] = [];
  filteredHistory: MyPayrollHistoryItem[] = [];
  payslipRows: PayslipListItem[] = [];
  yearOptions: number[] = [];
  statusFilterOptions: EmployeePayrollStatus[] = [];
  loading = true;
  error: string | null = null;

  filterYear = '';
  filterStatus = '';

  revealEarnings = false;
  revealDeductions = false;
  revealNet = false;
  revealHistoryNet = false;

  detailVisible = false;
  detail: EmployeePayrollDetail | null = null;
  detailLoading = false;

  ngOnInit(): void {
    this.load();
  }

  get errorTitle(): string {
    return /staff profile/i.test(this.error || '')
      ? 'Staff profile required'
      : 'My Payroll unavailable';
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.mySummary().pipe(finalizeBusy(v => (this.loading = v))).subscribe({
      next: summary => {
        this.summary = summary;
        this.loadHistory();
      },
      error: err => {
        const message = extractApiError(err, 'Request failed').message || 'Unable to load My Payroll';
        this.error = /no staff profile/i.test(message)
          ? 'Your login is not linked to a staff profile yet. Ask an administrator to link your user to a staff record.'
          : message;
      }
    });
  }

  loadHistory(): void {
    this.api.myHistory(0, 24).subscribe({
      next: page => {
        this.history = page.content ?? [];
        this.yearOptions = [...new Set(this.history.map(h => h.year))].sort((a, b) => b - a);
        this.statusFilterOptions = [...new Set(this.history.map(h => h.status))].sort();
        this.buildPayslipRows();
        this.applyHistoryFilters();
      },
      error: () => {
        this.history = [];
        this.filteredHistory = [];
        this.payslipRows = [];
        this.yearOptions = [];
        this.statusFilterOptions = [];
      }
    });
  }

  private buildPayslipRows(): void {
    const fromHistory = this.history
      .filter(h => h.payslipAvailable !== false && h.payslipDocumentId)
      .map(h => ({
        employeePayrollId: h.employeePayrollId,
        year: h.year,
        month: h.month,
        payslipNumber: null as string | null
      }));

    const latest = this.summary?.latestPayslip;
    if (latest && !fromHistory.some(r => r.employeePayrollId === latest.employeePayrollId)) {
      fromHistory.unshift({
        employeePayrollId: latest.employeePayrollId,
        year: latest.year,
        month: latest.month,
        payslipNumber: latest.payslipNumber ?? null
      });
    } else if (latest) {
      const match = fromHistory.find(r => r.employeePayrollId === latest.employeePayrollId);
      if (match) match.payslipNumber = latest.payslipNumber ?? null;
    }

    this.payslipRows = fromHistory.slice(0, 6);
  }

  applyHistoryFilters(): void {
    const year = this.filterYear ? Number(this.filterYear) : null;
    const status = this.filterStatus || '';
    this.filteredHistory = this.history.filter(row => {
      if (year != null && row.year !== year) return false;
      if (status && row.status !== status) return false;
      return true;
    });
  }

  resetHistoryFilters(): void {
    this.filterYear = '';
    this.filterStatus = '';
    this.applyHistoryFilters();
  }

  masked(value: number | null | undefined, revealed: boolean): string {
    if (value == null) return '—';
    if (!revealed) return '₹••••••';
    return '₹' + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  viewDetails(employeePayrollId: number): void {
    this.detailVisible = true;
    this.detailLoading = true;
    this.detail = null;
    this.api.myEmployeePayroll(employeePayrollId).pipe(finalizeBusy(v => (this.detailLoading = v))).subscribe({
      next: detail => {
        this.detail = detail;
      },
      error: err => {
        this.feedback.error('Details unavailable', extractApiError(err, 'Request failed').message);
      }
    });
  }

  downloadPayslip(employeePayrollId: number, available?: boolean): void {
    if (available === false) {
      this.feedback.error('Payslip not available', 'No stored payslip for this period.');
      return;
    }
    this.api.myDownloadPayslip(employeePayrollId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-payslip-${employeePayrollId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => this.feedback.error('Download failed', extractApiError(err, 'Request failed').message)
    });
  }

  contactAdmin(): void {
    const email = this.summary?.adminContactEmail;
    if (email) {
      window.location.href = `mailto:${email}?subject=Payroll%20query`;
      return;
    }
    this.feedback.info('Contact Administration', 'Please reach out to your school administration for payroll help.');
  }

  monthLabel = monthLabel;
  statusLabel = payrollStatusLabel;
  statusTone = payrollStatusTone;
}
