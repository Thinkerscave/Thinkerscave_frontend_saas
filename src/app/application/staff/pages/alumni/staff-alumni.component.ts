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
import { EmploymentStatus, StaffSummary } from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPageChangeEvent, slicePage } from '../../../../shared/utils/paged-result.util';

const ALUMNI_STATUSES: EmploymentStatus[] = ['RESIGNED', 'RETIRED', 'CONTRACT_COMPLETED'];

@Component({
  selector: 'app-staff-alumni',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AppPaginatorComponent],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-alumni.component.html'
})
export class StaffAlumniComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';
  keyword = '';
  alumni: StaffSummary[] = [];
  page = 0;
  pageSize: number = UI_PAGINATION.table.defaultSize;
  readonly pageSizeOptions = [...UI_PAGINATION.table.options];

  readonly statusLabels: Record<string, string> = {
    RESIGNED: 'Resigned',
    RETIRED: 'Retired',
    CONTRACT_COMPLETED: 'Contract Completed'
  };

  ngOnInit(): void {
    this.loadAlumni();
  }

  loadAlumni(): void {
    this.loading = true;
    this.api.getStaffList({ page: 0, size: 500, sort: 'createdOn,desc' })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (page) => {
          this.alumni = page.content.filter((s) => ALUMNI_STATUSES.includes(s.employmentStatus));
          this.page = 0;
          this.errorMessage = '';
        },
        error: () => { this.errorMessage = 'Unable to load alumni staff records.'; }
      });
  }

  filteredAlumni(): StaffSummary[] {
    const q = this.keyword.trim().toLowerCase();
    if (!q) {
      return this.alumni;
    }
    return this.alumni.filter((s) =>
      s.fullName.toLowerCase().includes(q) ||
      s.staffCode.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q)
    );
  }

  pagedAlumni(): StaffSummary[] {
    return slicePage(this.filteredAlumni(), this.page, this.pageSize);
  }

  onKeywordChange(value: string): void {
    this.keyword = value;
    this.page = 0;
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.cdr.markForCheck();
  }

  openProfile(staff: StaffSummary): void {
    this.router.navigate(['/app/staff/profile', staff.staffId]);
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  trackByStaff(_: number, s: StaffSummary): number {
    return s.staffId;
  }
}
