import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  EmploymentCategory,
  EmploymentStatus,
  PageResponse,
  StaffDashboard,
  StaffFilterParams,
  StaffSummary,
  StaffType
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';

interface KpiTile {
  key: keyof StaffDashboard;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-directory.component.html'
})
export class StaffDirectoryComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  searching = false;
  errorMessage = '';

  view: 'cards' | 'table' = 'cards';

  dashboard: StaffDashboard = {
    totalStaff: 0, teachingStaff: 0, nonTeachingStaff: 0,
    activeStaff: 0, temporaryStaff: 0, contractStaff: 0
  };

  staffPage: PageResponse<StaffSummary> = {
    content: [], totalElements: 0, totalPages: 0, size: 20, number: 0
  };

  filters: StaffFilterParams = { page: 0, size: 12, sort: 'createdOn,desc' };

  // Action menus
  openMenuId: number | null = null;
  actionLoading: number | null = null;

  readonly kpiTiles: KpiTile[] = [
    { key: 'totalStaff',      label: 'Total Staff',        icon: 'pi-users',       color: 'blue' },
    { key: 'teachingStaff',   label: 'Teaching Staff',     icon: 'pi-graduation-cap', color: 'indigo' },
    { key: 'nonTeachingStaff',label: 'Non Teaching Staff', icon: 'pi-briefcase',   color: 'violet' },
    { key: 'contractStaff',   label: 'Contract Staff',     icon: 'pi-file-edit',   color: 'amber' },
    { key: 'temporaryStaff',  label: 'Temporary Staff',    icon: 'pi-clock',       color: 'orange' },
    { key: 'activeStaff',     label: 'Active Staff',       icon: 'pi-check-circle',color: 'green' }
  ];

  readonly staffTypeOptions: { value: StaffType | ''; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'TEACHING', label: 'Teaching' },
    { value: 'NON_TEACHING', label: 'Non Teaching' }
  ];

  readonly categoryOptions: { value: EmploymentCategory | ''; label: string }[] = [
    { value: '', label: 'All Categories' },
    { value: 'PERMANENT', label: 'Permanent' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'TEMPORARY', label: 'Temporary' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'VISITING_FACULTY', label: 'Visiting Faculty' }
  ];

  readonly statusOptions: { value: EmploymentStatus | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PROBATION', label: 'Probation' },
    { value: 'NOTICE_PERIOD', label: 'Notice Period' },
    { value: 'RESIGNED', label: 'Resigned' },
    { value: 'RETIRED', label: 'Retired' },
    { value: 'CONTRACT_COMPLETED', label: 'Contract Completed' }
  ];

  ngOnInit(): void {
    this.loadDashboard();
    this.loadStaff();
  }

  loadDashboard(): void {
    this.api.getDashboard().subscribe({
      next: d => { this.dashboard = d; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  loadStaff(): void {
    this.loading = true;
    this.api.getStaffList(this.filters)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: page => { this.staffPage = page; },
        error: () => { this.errorMessage = 'Unable to load staff. Please try again.'; }
      });
  }

  search(): void {
    this.filters = { ...this.filters, page: 0 };
    this.searching = true;
    this.api.getStaffList(this.filters)
      .pipe(finalize(() => { this.searching = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: page => { this.staffPage = page; this.errorMessage = ''; },
        error: () => { this.errorMessage = 'Search failed. Please retry.'; }
      });
  }

  clearFilters(): void {
    this.filters = { page: 0, size: 12, sort: 'createdOn,desc' };
    this.search();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.staffPage.totalPages) { return; }
    this.filters = { ...this.filters, page };
    this.loadStaff();
  }

  get pageNumbers(): number[] {
    const total = this.staffPage.totalPages;
    const current = this.staffPage.number;
    const pages: number[] = [];
    const range = 2;
    for (let i = Math.max(0, current - range); i <= Math.min(total - 1, current + range); i++) {
      pages.push(i);
    }
    return pages;
  }

  openProfile(staff: StaffSummary): void {
    this.router.navigate(['/app/staff/profile', staff.staffId]);
  }

  addStaff(): void {
    this.router.navigate(['/app/staff/create']);
  }

  editStaff(staff: StaffSummary, event?: Event): void {
    event?.stopPropagation();
    this.closeMenu();
    this.router.navigate(['/app/staff/edit', staff.staffId]);
  }

  toggleMenu(staffId: number, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === staffId ? null : staffId;
    this.cdr.markForCheck();
  }

  closeMenu(): void { this.openMenuId = null; }

  toggleActive(staff: StaffSummary, event?: Event): void {
    event?.stopPropagation();
    this.closeMenu();
    this.actionLoading = staff.staffId;
    const obs = staff.active
      ? this.api.deactivateStaff(staff.staffId)
      : this.api.activateStaff(staff.staffId);
    obs.pipe(finalize(() => { this.actionLoading = null; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { staff.active = !staff.active; this.loadDashboard(); },
        error: () => {}
      });
  }

  deleteStaff(staff: StaffSummary, event?: Event): void {
    event?.stopPropagation();
    this.closeMenu();
    if (!confirm(`Delete ${staff.fullName}? This action cannot be undone.`)) { return; }
    this.actionLoading = staff.staffId;
    this.api.deleteStaff(staff.staffId)
      .pipe(finalize(() => { this.actionLoading = null; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.staffPage.content = this.staffPage.content.filter(s => s.staffId !== staff.staffId);
          this.loadDashboard();
        },
        error: () => {}
      });
  }

  initials(name: string): string {
    if (!name) { return '?'; }
    return name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  staffTypeBadge(type: StaffSummary['staffType']): string {
    return type === 'TEACHING' ? 'Teaching' : 'Non-Teaching';
  }

  categoryLabel(cat: StaffSummary['employmentCategory']): string {
    const map: Record<string, string> = {
      PERMANENT: 'Permanent', CONTRACT: 'Contract', TEMPORARY: 'Temporary',
      PART_TIME: 'Part Time', VISITING_FACULTY: 'Visiting'
    };
    return map[cat] ?? cat;
  }

  trackByStaff(_: number, item: StaffSummary): number { return item.staffId; }

  getMin(a: number, b: number): number { return Math.min(a, b); }
}
