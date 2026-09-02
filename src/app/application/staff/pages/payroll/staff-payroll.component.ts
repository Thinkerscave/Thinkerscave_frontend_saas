import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs';

import {
  PageResponse,
  Payroll,
  PayrollDashboard,
  PayrollFilterParams,
  PayrollStatus
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';

interface KpiTile {
  key: keyof PayrollDashboard | 'currentMonth';
  label: string;
  icon: string;
  color: string;
  isCurrency?: boolean;
}

@Component({
  selector: 'app-staff-payroll',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, AppPaginatorComponent],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-payroll.component.html'
})
export class StaffPayrollComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  loadingDashboard = true;
  searching = false;
  errorMessage = '';
  generateInfoMessage = '';

  dashboard: PayrollDashboard = {
    totalStaff: 0, generatedPayroll: 0, pendingPayroll: 0,
    paidPayroll: 0, totalAmount: 0
  };

  payrollPage: PageResponse<Payroll> = {
    content: [], totalElements: 0, totalPages: 0, size: UI_PAGINATION.table.defaultSize, number: 0
  };

  filters: PayrollFilterParams = { page: 0, size: UI_PAGINATION.table.defaultSize };
  readonly pageSizeOptions = UI_PAGINATION.table.options;

  readonly kpiTiles: KpiTile[] = [
    { key: 'currentMonth',     label: 'Current Month',      icon: 'pi-calendar',      color: 'blue' },
    { key: 'totalStaff',       label: 'Total Staff',        icon: 'pi-users',         color: 'indigo' },
    { key: 'generatedPayroll', label: 'Generated Payrolls', icon: 'pi-file',          color: 'violet' },
    { key: 'pendingPayroll',   label: 'Pending Payrolls',   icon: 'pi-clock',         color: 'amber' },
    { key: 'paidPayroll',      label: 'Paid Payrolls',      icon: 'pi-check-circle',  color: 'green' },
    { key: 'totalAmount',      label: 'Total Amount',       icon: 'pi-money-bill',    color: 'emerald', isCurrency: true }
  ];

  readonly yearOptions = [
    { label: '2023', value: 2023 },
    { label: '2024', value: 2024 },
    { label: '2025', value: 2025 },
    { label: '2026', value: 2026 }
  ];

  readonly monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    label: new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' }),
    value: m
  }));

  readonly statusOptions: { value: PayrollStatus | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'GENERATED', label: 'Generated' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Generate modal
  showGenerateModal = false;
  generating = false;
  exporting = false;
  generateYear = new Date().getFullYear();
  generateMonth = new Date().getMonth() + 1; // 1-12

  // Bulk select
  selectedIds: Set<number> = new Set();
  bulkLoading = false;

  get currentMonthName(): string {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get allSelected(): boolean {
    return this.payrollPage.content.length > 0 &&
           this.payrollPage.content.every(p => this.selectedIds.has(p.payrollId));
  }

  ngOnInit(): void {
    this.filters.year = new Date().getFullYear();
    this.filters.month = new Date().getMonth() + 1;
    this.loadDashboard();
    this.loadList();
  }

  loadDashboard(): void {
    this.loadingDashboard = true;
    this.api.getPayrollDashboard()
      .pipe(finalize(() => { this.loadingDashboard = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (d) => {
          this.dashboard = { ...d, totalAmount: d.totalAmount ?? 0 };
        }
      });
  }

  loadList(): void {
    this.loading = true;
    this.selectedIds.clear();
    this.api.getPayrollList(this.filters)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (page) => {
          this.payrollPage = page;
          this.dashboard.totalAmount = page.content.reduce((sum, p) => sum + (p.netSalary || 0), 0);
        },
        error: () => { this.errorMessage = 'Unable to load payroll.'; }
      });
  }

  search(): void {
    this.filters.page = 0;
    this.searching = true;
    this.api.getPayrollList(this.filters)
      .pipe(finalize(() => { this.searching = false; this.cdr.markForCheck(); }))
      .subscribe({ next: page => { this.payrollPage = page; } });
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.filters.page = event.page;
    this.filters.size = event.rows;
    this.loadList();
  }

  // ── GENERATE ──────────────────────────────────────────────────────────────────

  openGenerate(): void {
    this.generateYear = new Date().getFullYear();
    this.generateMonth = new Date().getMonth() + 1;
    this.showGenerateModal = true;
  }

  closeGenerate(): void { this.showGenerateModal = false; }

  generatePayroll(): void {
    this.generating = true;
    this.generateInfoMessage = '';
    this.api.generatePayroll({ year: this.generateYear, month: this.generateMonth })
      .pipe(finalize(() => { this.generating = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (result) => {
          this.closeGenerate();
          this.filters.year = this.generateYear;
          this.filters.month = this.generateMonth;
          const skipped = result.skippedNoSalaryStructure?.length ?? 0;
          this.generateInfoMessage = skipped > 0
            ? `Generated ${result.generatedRecords} record(s). Skipped without salary structure: ${result.skippedNoSalaryStructure.join(', ')}`
            : `Generated ${result.generatedRecords} payroll record(s).`;
          this.search();
          this.loadDashboard();
        },
        error: () => {
          this.errorMessage = 'Unable to generate payroll.';
        }
      });
  }

  // ── BULK ACTIONS ─────────────────────────────────────────────────────────────

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedIds.clear();
    } else {
      this.payrollPage.content.forEach(p => this.selectedIds.add(p.payrollId));
    }
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) { this.selectedIds.delete(id); }
    else { this.selectedIds.add(id); }
  }

  markPaidBulk(): void {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Mark ${this.selectedIds.size} payroll records as paid?`)) return;
    
    this.bulkLoading = true;
    this.api.bulkMarkPaid({ payrollIds: Array.from(this.selectedIds) })
      .pipe(finalize(() => { this.bulkLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.search();
          this.loadDashboard();
        }
      });
  }

  markPaidSingle(payroll: Payroll): void {
    this.api.markPaid(payroll.payrollId).subscribe({
      next: () => {
        payroll.status = 'PAID';
        this.loadDashboard();
        this.cdr.markForCheck();
      }
    });
  }

  downloadPayslip(payroll: Payroll): void {
    this.api.downloadPayslip(payroll.payrollId).subscribe({
      next: (blob) => this.saveBlob(blob, `payslip-${payroll.staffCode}-${payroll.payrollYear}-${payroll.payrollMonth}.pdf`),
      error: () => { this.errorMessage = 'Unable to download payslip.'; this.cdr.markForCheck(); }
    });
  }

  exportReport(): void {
    if (!this.filters.year || !this.filters.month) { return; }
    this.exporting = true;
    this.api.exportPayrollReport(this.filters.year, this.filters.month)
      .pipe(finalize(() => { this.exporting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (blob) => this.saveBlob(blob, `payroll-report-${this.filters.year}-${this.filters.month}.xlsx`),
        error: () => { this.errorMessage = 'Unable to export payroll report.'; }
      });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  monthName(monthNum: number): string {
    return new Date(2000, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
  }

  trackById(_: number, p: Payroll): number { return p.payrollId; }
}
