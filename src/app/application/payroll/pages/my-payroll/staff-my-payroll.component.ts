import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import {
  EmployeePayrollDetail,
  MyPayrollHistoryItem,
  MyPayrollSummary,
  PAYROLL_RESOURCES,
  monthLabel,
  payrollStatusLabel,
  payrollStatusTone
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-staff-my-payroll',
  standalone: true,
  imports: [CommonModule, DialogModule, HasPermissionDirective, AppToastComponent, SaasPageHeaderComponent],
  templateUrl: './staff-my-payroll.component.html',
  styleUrls: ['../../payroll.shared.scss']
})
export class StaffMyPayrollComponent implements OnInit {
  private readonly api = inject(PayrollApiService);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = PAYROLL_RESOURCES;
  summary: MyPayrollSummary | null = null;
  history: MyPayrollHistoryItem[] = [];
  loading = true;
  error: string | null = null;

  revealEarnings = false;
  revealDeductions = false;
  revealNet = false;

  detailVisible = false;
  detail: EmployeePayrollDetail | null = null;
  detailLoading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.mySummary().subscribe({
      next: summary => {
        this.summary = summary;
        this.loading = false;
        this.loadHistory();
      },
      error: err => {
        this.loading = false;
        this.error = extractApiError(err, 'Request failed').message || 'Unable to load My Payroll';
      }
    });
  }

  loadHistory(): void {
    this.api.myHistory(0, 24).subscribe({
      next: page => (this.history = page.content),
      error: () => (this.history = [])
    });
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
    this.api.myEmployeePayroll(employeePayrollId).subscribe({
      next: detail => {
        this.detail = detail;
        this.detailLoading = false;
      },
      error: err => {
        this.detailLoading = false;
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
