import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  PageResponse,
  Payroll,
  PayrollDashboard,
  PayrollFilterParams,
  PayrollStatus
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';

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
  imports: [CommonModule, FormsModule],
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

  dashboard: PayrollDashboard = {
    totalStaff: 0, generatedPayroll: 0, pendingPayroll: 0,
    paidPayroll: 0, totalAmount: 0
  };

  payrollPage: PageResponse<Payroll> = {
    content: [], totalElements: 0, totalPages: 0, size: 20, number: 0
  };

  filters: PayrollFilterParams = { page: 0, size: 12 };

  readonly kpiTiles: KpiTile[] = [
    { key: 'currentMonth',     label: 'Current Month',      icon: 'pi-calendar',      color: 'blue' },
    { key: 'totalStaff',       label: 'Total Staff',        icon: 'pi-users',         color: 'indigo' },
    { key: 'generatedPayroll', label: 'Generated Payrolls', icon: 'pi-file',          color: 'violet' },
    { key: 'pendingPayroll',   label: 'Pending Payrolls',   icon: 'pi-clock',         color: 'amber' },
    { key: 'paidPayroll',      label: 'Paid Payrolls',      icon: 'pi-check-circle',  color: 'green' },
    { key: 'totalAmount',      label: 'Total Amount',       icon: 'pi-money-bill',    color: 'emerald', isCurrency: true }
  ];

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
      .subscribe({ next: d => { this.dashboard = d; } });
  }

  loadList(): void {
    this.loading = true;
    this.selectedIds.clear();
    this.api.getPayrollList(this.filters)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: page => { this.payrollPage = page; },
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

  goToPage(page: number): void {
    if (page < 0 || page >= this.payrollPage.totalPages) { return; }
    this.filters.page = page;
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
    this.api.generatePayroll({ year: this.generateYear, month: this.generateMonth })
      .pipe(finalize(() => { this.generating = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.closeGenerate();
          this.filters.year = this.generateYear;
          this.filters.month = this.generateMonth;
          this.search();
          this.loadDashboard();
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

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  monthName(monthNum: number): string {
    return new Date(2000, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
  }

  get pageNumbers(): number[] {
    const total = this.payrollPage.totalPages;
    const current = this.payrollPage.number;
    const pages: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) {
      pages.push(i);
    }
    return pages;
  }

  trackById(_: number, p: Payroll): number { return p.payrollId; }
}
