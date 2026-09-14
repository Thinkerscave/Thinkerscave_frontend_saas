import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { RecordPaymentDialogComponent } from '../../components/record-payment-dialog/record-payment-dialog.component';
import {
  EmployeePayrollDetail,
  PAYROLL_RESOURCES,
  PayrollEmployeeListItem,
  PayrollRunDetail,
  monthLabel,
  payrollStatusLabel,
  payrollStatusTone
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

type RunTab = 'employees' | 'summary' | 'approval' | 'payments';

@Component({
  selector: 'app-payroll-run-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HasPermissionDirective,
    AppToastComponent,
    SaasPageHeaderComponent,
    RecordPaymentDialogComponent
  ],
  templateUrl: './payroll-run-detail-page.component.html',
  styleUrls: ['../../payroll.shared.scss']
})
export class PayrollRunDetailPageComponent implements OnInit {
  private readonly api = inject(PayrollApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = PAYROLL_RESOURCES;
  runId = 0;
  run: PayrollRunDetail | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  activeTab: RunTab = 'employees';
  returnRemarks = '';

  paymentVisible = false;
  paymentEmployee: PayrollEmployeeListItem | null = null;
  paymentRemaining: number | null = null;

  ngOnInit(): void {
    this.runId = Number(this.route.snapshot.paramMap.get('runId'));
    this.load();
  }

  load(): void {
    if (!this.runId) {
      this.error = 'Invalid run id';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = null;
    this.api.getRun(this.runId).subscribe({
      next: run => {
        this.run = run;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.error = extractApiError(err, 'Request failed').message || 'Failed to load payroll run';
      }
    });
  }

  get canRecalculate(): boolean {
    const s = this.run?.status;
    return s === 'GENERATED' || s === 'PENDING_APPROVAL';
  }

  get canApprove(): boolean {
    return this.run?.status === 'PENDING_APPROVAL';
  }

  get hasAnyPayment(): boolean {
    return (this.run?.employees ?? []).some(e => e.status === 'PAID' || e.status === 'PARTIALLY_PAID' || (e.paidAmount ?? 0) > 0);
  }

  recalculate(): void {
    if (!this.canRecalculate || this.hasAnyPayment) return;
    this.saving = true;
    this.api.recalculateRun(this.runId).subscribe({
      next: run => {
        this.run = run;
        this.saving = false;
        this.feedback.success('Recalculated', 'Payroll run updated.');
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Recalculate failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  approve(): void {
    this.saving = true;
    this.api.approveRun(this.runId).subscribe({
      next: run => {
        this.run = run;
        this.saving = false;
        this.feedback.success('Approved', 'Payroll run approved.');
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Approve failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  returnRun(): void {
    this.saving = true;
    this.api.returnRun(this.runId, this.returnRemarks || undefined).subscribe({
      next: run => {
        this.run = run;
        this.saving = false;
        this.feedback.success('Returned', 'Payroll run returned for correction.');
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Return failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  openPayment(row: EmployeePayrollDetail): void {
    this.paymentEmployee = {
      staffId: row.staffId,
      employeeName: row.employeeName || `#${row.staffId}`,
      employeeCode: row.employeeCode,
      employeePayrollId: row.employeePayrollId,
      netAmount: row.netAmount,
      status: row.status,
      paymentType: row.paymentType
    };
    this.paymentRemaining = row.remainingAmount ?? Math.max(0, row.netAmount - (row.paidAmount ?? 0));
    this.paymentVisible = true;
  }

  canPay(row: EmployeePayrollDetail): boolean {
    return row.status === 'APPROVED' || row.status === 'PARTIALLY_PAID';
  }

  downloadPayslip(row: EmployeePayrollDetail): void {
    if (!row.payslipDocumentId) {
      this.feedback.error('Payslip not available', 'No stored payslip document.');
      return;
    }
    this.api.downloadPayslip(row.employeePayrollId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip-${row.employeePayrollId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => this.feedback.error('Download failed', extractApiError(err, 'Request failed').message)
    });
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  monthLabel = monthLabel;
  statusLabel = payrollStatusLabel;
  statusTone = payrollStatusTone;
}
