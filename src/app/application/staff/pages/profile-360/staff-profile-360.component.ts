import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { finalize, forkJoin } from 'rxjs';

import {
  Payroll,
  ResponsibilityAssignment,
  ResponsibilityAssignmentRequest,
  Responsibility,
  SalaryStructure,
  SalaryStructureRequest,
  SalaryType,
  StaffDetail,
  PageResponse
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';

type ProfileTab = 'overview' | 'responsibilities' | 'salary' | 'payroll' | 'documents' | 'activity';

interface TabConfig { id: ProfileTab; label: string; icon: string; }

@Component({
  selector: 'app-staff-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-profile-360.component.html'
})
export class StaffProfile360Component implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly api = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';
  actionLoading = false;

  staffId = 0;
  profile?: StaffDetail;
  salaryHistory: SalaryStructure[] = [];
  payrollPage?: PageResponse<Payroll>;
  loadingPayroll = false;

  activeTab: ProfileTab = 'overview';

  readonly tabs: TabConfig[] = [
    { id: 'overview',         label: 'Overview',         icon: 'pi-user' },
    { id: 'responsibilities', label: 'Responsibilities', icon: 'pi-sitemap' },
    { id: 'salary',           label: 'Salary',           icon: 'pi-money-bill' },
    { id: 'payroll',          label: 'Payroll',          icon: 'pi-wallet' },
    { id: 'documents',        label: 'Documents',        icon: 'pi-folder-open' },
    { id: 'activity',         label: 'Activity',         icon: 'pi-history' }
  ];

  // ── Assign Responsibility Modal ──────────────────────────────────────────────
  showAssignModal = false;
  allResponsibilities: Responsibility[] = [];
  assignForm: ResponsibilityAssignmentRequest = this.emptyAssignForm();

  // ── Salary Modal ──────────────────────────────────────────────────────────────
  showSalaryModal = false;
  salaryForm: SalaryStructureRequest = this.emptySalaryForm();
  editSalaryId: number | null = null;
  savingSalary = false;

  readonly salaryTypeOptions: { value: SalaryType; label: string }[] = [
    { value: 'MONTHLY',    label: 'Monthly' },
    { value: 'DAILY_WAGE', label: 'Daily Wage' }
  ];

  get responsibilityOptions(): { label: string; value: number }[] {
    return [
      { label: 'Select Responsibility', value: 0 },
      ...this.allResponsibilities.map(r => ({
        label: `${r.responsibilityName} (${r.responsibilityCode})`,
        value: r.responsibilityId ?? 0
      }))
    ];
  }
  get grossSalary(): number {
    return (this.salaryForm.basicPay ?? 0) + (this.salaryForm.hra ?? 0)
         + (this.salaryForm.da ?? 0) + (this.salaryForm.specialAllowance ?? 0)
         + (this.salaryForm.transportAllowance ?? 0) + (this.salaryForm.otherAllowance ?? 0);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const id = Number(p.get('id'));
      if (!id) { this.errorMessage = 'Invalid staff ID.'; this.loading = false; this.cdr.markForCheck(); return; }
      this.staffId = id;
      const tab = this.route.snapshot.queryParamMap.get('tab') as ProfileTab | null;
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab = tab;
      }
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.api.getStaffDetail(this.staffId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: profile => { this.profile = profile; },
        error: () => { this.errorMessage = 'Unable to load profile.'; }
      });
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    if (tab === 'payroll' && !this.payrollPage) { this.loadPayroll(); }
    if (tab === 'salary' && this.salaryHistory.length === 0) { this.loadSalaryHistory(); }
  }

  loadPayroll(): void {
    this.loadingPayroll = true;
    this.api.getPayrollList({ staffId: this.staffId, size: 12 })
      .pipe(finalize(() => { this.loadingPayroll = false; this.cdr.markForCheck(); }))
      .subscribe({ next: page => { this.payrollPage = page; } });
  }

  loadSalaryHistory(): void {
    this.api.getSalaryHistory(this.staffId)
      .subscribe({ next: h => { this.salaryHistory = h; this.cdr.markForCheck(); } });
  }

  // ── Quick Actions ────────────────────────────────────────────────────────────

  editProfile(): void {
    this.router.navigate(['/app/staff/edit', this.staffId]);
  }

  toggleActive(): void {
    if (!this.profile) { return; }
    this.actionLoading = true;
    const obs = this.profile.active
      ? this.api.deactivateStaff(this.staffId)
      : this.api.activateStaff(this.staffId);
    obs.pipe(finalize(() => { this.actionLoading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: () => { if (this.profile) { this.profile.active = !this.profile.active; } } });
  }

  // ── Assign Responsibility ────────────────────────────────────────────────────

  openAssignModal(): void {
    if (this.allResponsibilities.length === 0) {
      this.api.getResponsibilities().subscribe(r => {
        this.allResponsibilities = r;
        this.cdr.markForCheck();
      });
    }
    this.assignForm = this.emptyAssignForm();
    this.showAssignModal = true;
  }

  emptyAssignForm(): ResponsibilityAssignmentRequest {
    return {
      staffId: this.staffId,
      responsibilityId: 0,
      scope: '',
      effectiveFrom: new Date().toISOString().substring(0, 10)
    };
  }

  saveAssignment(): void {
    if (!this.assignForm.responsibilityId) { return; }
    this.assignForm.staffId = this.staffId;
    this.api.assignResponsibility(this.assignForm)
      .subscribe({
        next: () => {
          this.showAssignModal = false;
          this.load();
        }
      });
  }

  removeAssignment(assignment: ResponsibilityAssignment): void {
    if (!confirm(`Remove responsibility "${assignment.responsibilityName}"?`)) { return; }
    this.api.removeAssignment(assignment.assignmentId)
      .subscribe({ next: () => { this.load(); } });
  }

  // ── Salary Modal ─────────────────────────────────────────────────────────────

  openSalaryModal(existing?: SalaryStructure): void {
    if (existing) {
      this.editSalaryId = existing.salaryStructureId;
      this.salaryForm = {
        staffId: this.staffId,
        salaryType: existing.salaryType,
        basicPay: existing.basicPay,
        hra: existing.hra,
        da: existing.da,
        specialAllowance: existing.specialAllowance,
        transportAllowance: existing.transportAllowance,
        otherAllowance: existing.otherAllowance,
        pfEmployee: existing.pfEmployee,
        esiEmployee: existing.esiEmployee,
        professionalTax: existing.professionalTax,
        otherDeduction: existing.otherDeduction,
        bankName: existing.bankName,
        accountHolderName: existing.accountHolderName,
        accountNumber: existing.accountNumber,
        ifscCode: existing.ifscCode,
        effectiveFrom: existing.effectiveFrom
      };
    } else {
      this.editSalaryId = null;
      this.salaryForm = this.emptySalaryForm();
    }
    this.showSalaryModal = true;
  }

  emptySalaryForm(): SalaryStructureRequest {
    return {
      staffId: this.staffId,
      salaryType: 'MONTHLY',
      effectiveFrom: new Date().toISOString().substring(0, 10)
    };
  }

  saveSalary(): void {
    if (!this.salaryForm.effectiveFrom) { return; }
    this.savingSalary = true;
    this.salaryForm.staffId = this.staffId;
    if (this.editSalaryId) {
      this.api.updateSalaryStructure(this.editSalaryId, this.salaryForm)
        .pipe(finalize(() => { this.savingSalary = false; this.cdr.markForCheck(); }))
        .subscribe({
          next: () => {
            this.showSalaryModal = false;
            this.loadSalaryHistory();
            this.load();
          }
        });
    } else {
      this.api.createSalaryStructure(this.salaryForm)
        .pipe(finalize(() => { this.savingSalary = false; this.cdr.markForCheck(); }))
        .subscribe({
          next: () => {
            this.showSalaryModal = false;
            this.loadSalaryHistory();
            this.load();
          }
        });
    }
  }

  // ── Payroll ───────────────────────────────────────────────────────────────────

  markPaid(payroll: Payroll): void {
    this.api.markPaid(payroll.payrollId).subscribe({
      next: () => { payroll.status = 'PAID'; this.cdr.markForCheck(); }
    });
  }

  downloadPayslip(payroll: Payroll): void {
    this.api.downloadPayslip(payroll.payrollId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip-${payroll.staffCode}-${payroll.payrollYear}-${payroll.payrollMonth}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  initials(name?: string): string {
    if (!name) { return '?'; }
    return name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  back(): void { this.router.navigate(['/app/staff/directory']); }

  monthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  trackByIdx(i: number): number { return i; }
  trackByPayrollId(_: number, p: Payroll): number { return p.payrollId; }
  trackByAssignId(_: number, a: ResponsibilityAssignment): number { return a.assignmentId; }
}
