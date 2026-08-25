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
import { DropdownModule } from 'primeng/dropdown';

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
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { ListQuerySession } from '../../../../shared/utils/list-query.session';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { CreateStaffComponent } from '../create-staff/create-staff.component';

interface KpiTile {
  key: keyof StaffDashboard;
  label: string;
  icon: string;
  color: string;
}

interface FilterOption<T = string | null> {
  label: string;
  value: T;
}

const LIST_KEY = 'staff.directory.view';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent,
    AvatarComponent,
    SkeletonComponent,
    EmptyStateComponent,
    CreateStaffComponent
  ],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-directory.component.html'
})
export class StaffDirectoryComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly query = new ListQuerySession();

  loading = true;
  refreshing = false;
  hasLoaded = false;
  searching = false;
  errorMessage = '';
  showAddDrawer = false;

  view: AppListViewMode = this.viewPrefs.globalDefault();

  dashboard: StaffDashboard = {
    totalStaff: 0, teachingStaff: 0, nonTeachingStaff: 0,
    activeStaff: 0, temporaryStaff: 0, contractStaff: 0
  };

  staffPage: PageResponse<StaffSummary> = {
    content: [], totalElements: 0, totalPages: 0, size: 20, number: 0
  };

  filters: StaffFilterParams = { page: 0, size: UI_PAGINATION.defaultSize, sort: 'createdOn,desc' };
  private appliedFilters: StaffFilterParams = { page: 0, size: UI_PAGINATION.defaultSize, sort: 'createdOn,desc' };
  readonly pageSizeOptions = UI_PAGINATION.options;

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

  readonly staffTypeOptions: FilterOption<StaffType | undefined>[] = [
    { value: undefined, label: 'All Types' },
    { value: 'TEACHING', label: 'Teaching' },
    { value: 'NON_TEACHING', label: 'Non Teaching' }
  ];

  readonly categoryOptions: FilterOption<EmploymentCategory | undefined>[] = [
    { value: undefined, label: 'All Categories' },
    { value: 'PERMANENT', label: 'Permanent' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'TEMPORARY', label: 'Temporary' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'VISITING_FACULTY', label: 'Visiting Faculty' }
  ];

  readonly statusOptions: FilterOption<EmploymentStatus | undefined>[] = [
    { value: undefined, label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PROBATION', label: 'Probation' },
    { value: 'NOTICE_PERIOD', label: 'Notice Period' },
    { value: 'RESIGNED', label: 'Resigned' },
    { value: 'RETIRED', label: 'Retired' },
    { value: 'CONTRACT_COMPLETED', label: 'Contract Completed' }
  ];

  ngOnInit(): void {
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.view = this.viewPrefs.initialView(saved.view);
      this.filters = {
        ...this.filters,
        page: saved.page ?? this.filters.page,
        size: saved.size ?? this.filters.size,
        keyword: saved.search || undefined
      };
      this.appliedFilters = { ...this.filters };
    }
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
    const requestId = this.query.beginRequest();
    this.refreshing = true;
    this.searching = true;
    if (!this.hasLoaded) {
      this.loading = true;
    }
    const request: StaffFilterParams = {
      ...this.appliedFilters,
      keyword: this.filters.keyword,
      page: this.filters.page,
      size: this.filters.size,
      sort: this.filters.sort
    };
    this.api.getStaffList(request)
      .pipe(finalize(() => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.loading = false;
        this.refreshing = false;
        this.searching = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: page => {
          if (!this.query.isCurrent(requestId)) {
            return;
          }
          this.staffPage = page;
          this.errorMessage = '';
        },
        error: () => {
          if (!this.query.isCurrent(requestId)) {
            return;
          }
          this.errorMessage = 'Unable to load staff. Please try again.';
        }
      });
  }

  applyQuery(): void {
    this.filters = { ...this.filters, page: 0 };
    this.loadStaff();
  }

  search(): void {
    this.appliedFilters = {
      staffType: this.filters.staffType,
      employmentCategory: this.filters.employmentCategory,
      employmentStatus: this.filters.employmentStatus
    };
    this.filters = { ...this.filters, page: 0 };
    this.loadStaff();
  }

  clearFilters(): void {
    this.filters = { page: 0, size: UI_PAGINATION.defaultSize, sort: 'createdOn,desc' };
    this.appliedFilters = { page: 0, size: UI_PAGINATION.defaultSize, sort: 'createdOn,desc' };
    this.loadStaff();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    const nextSize = event.rows ?? this.filters.size;
    this.filters = {
      ...this.filters,
      page: nextSize !== this.filters.size ? 0 : (event.page ?? 0),
      size: nextSize
    };
    this.loadStaff();
  }

  onKeywordChange(value: string): void {
    this.filters = { ...this.filters, keyword: value };
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.view = mode;
    this.cdr.markForCheck();
  }

  openProfile(staff: StaffSummary): void {
    this.persistListContext();
    this.router.navigate(['/app/staff/profile', staff.staffId]);
  }

  addStaff(): void {
    this.showAddDrawer = true;
  }

  closeAddDrawer(): void {
    this.showAddDrawer = false;
  }

  onStaffAdded(): void {
    this.showAddDrawer = false;
    this.loadStaff();
    this.loadDashboard();
  }

  editStaff(staff: StaffSummary, event?: Event): void {
    event?.stopPropagation();
    this.closeMenu();
    this.persistListContext();
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
    const req$ = staff.active
      ? this.api.deactivateStaff(staff.staffId)
      : this.api.activateStaff(staff.staffId);
    req$.pipe(finalize(() => { this.actionLoading = null; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.loadStaff(),
        error: () => { this.errorMessage = 'Unable to update staff status.'; }
      });
  }

  deleteStaff(staff: StaffSummary, event?: Event): void {
    event?.stopPropagation();
    this.closeMenu();
    if (!confirm(`Delete ${staff.fullName}? This action cannot be undone.`)) return;
    this.actionLoading = staff.staffId;
    this.api.deleteStaff(staff.staffId)
      .pipe(finalize(() => { this.actionLoading = null; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.loadStaff(),
        error: () => { this.errorMessage = 'Unable to delete staff member.'; }
      });
  }

  trackByStaff(_: number, s: StaffSummary): number { return s.staffId; }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
  }

  staffTypeBadge(type: StaffType): string {
    return type === 'TEACHING' ? 'Teaching' : 'Non Teaching';
  }

  categoryLabel(category: EmploymentCategory): string {
    return this.categoryOptions.find(o => o.value === category)?.label ?? category;
  }

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.filters.page,
      size: this.filters.size,
      search: this.filters.keyword ?? '',
      view: this.view
    });
  }
}
