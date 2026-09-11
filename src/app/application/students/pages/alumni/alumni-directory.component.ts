import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs';

import { AlumniFilters, AlumniResponse } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPageChangeEvent, slicePage } from '../../../../shared/utils/paged-result.util';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent, KpiGroupComponent, KpiTone } from '../../../../shared/ui/kpi';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';

interface SelectOption {
  label: string;
  value: string | null;
}

interface KpiTile {
  key: 'total' | 'thisYear' | 'contactable' | 'linkedIn';
  label: string;
  icon: string;
  tone: KpiTone;
  value: number;
}

@Component({
  selector: 'app-alumni-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, DropdownModule,
    AppPaginatorComponent, AppListToolbarComponent, AppListResultsComponent,
    AvatarComponent, SkeletonComponent, EmptyStateComponent,
    KpiCardComponent, KpiGroupComponent, SaasPageHeaderComponent
  ],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './alumni-directory.component.html'
})
export class AlumniDirectoryComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly viewPrefs = inject(ViewPreferenceService);

  loading = true;
  searching = false;
  errorMessage = '';
  view: AppListViewMode = this.viewPrefs.initialView();

  filters: AlumniFilters = {};
  alumni: AlumniResponse[] = [];
  page = 0;
  pageSize: number = UI_PAGINATION.table.defaultSize;
  readonly pageSizeOptions = [...UI_PAGINATION.table.options];

  readonly passoutYears = ['2025', '2024', '2023', '2022', '2021', '2020', 'Before 2020'];
  readonly passoutYearOptions: SelectOption[] = [
    { label: 'All Years', value: null },
    ...this.passoutYears.map(y => ({ label: y, value: y }))
  ];

  get hasContextualQuery(): boolean {
    return !!(
      this.filters.keyword?.trim() ||
      this.filters.passoutYear ||
      this.filters.course?.trim() ||
      this.filters.city?.trim()
    );
  }

  get contextualResultText(): string {
    const total = this.alumni.length;
    if (total <= 0) {
      return 'No alumni found';
    }
    if (this.hasContextualQuery) {
      const visible = this.paged.length;
      if (visible >= total) {
        return `${total} alumni found`;
      }
      return `Showing ${visible} of ${total} alumni`;
    }
    return 'Stay connected with your past graduates.';
  }

  ngOnInit(): void {
    this.runSearch();
  }

  get paged(): AlumniResponse[] {
    return slicePage(this.alumni, this.page, this.pageSize);
  }

  get kpiTiles(): KpiTile[] {
    const currentYear = String(new Date().getFullYear());
    const total = this.alumni.length;
    const thisYear = this.alumni.filter(a => a.yearPassed === currentYear).length;
    const contactable = this.alumni.filter(a => a.contact || a.email).length;
    const linkedIn = this.alumni.filter(a => a.linkedIn).length;
    return [
      { key: 'total', label: 'Total Alumni', icon: 'pi pi-users', tone: 'primary', value: total },
      { key: 'thisYear', label: `Passed Out ${currentYear}`, icon: 'pi pi-calendar', tone: 'info', value: thisYear },
      { key: 'contactable', label: 'Contactable', icon: 'pi pi-phone', tone: 'success', value: contactable },
      { key: 'linkedIn', label: 'LinkedIn Linked', icon: 'pi pi-linkedin', tone: 'neutral', value: linkedIn }
    ];
  }

  onKeywordChange(value: string): void {
    this.filters.keyword = value;
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.view = mode;
    this.cdr.markForCheck();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.cdr.markForCheck();
  }

  runSearch(): void {
    this.loading = true;
    this.searching = true;
    this.api.alumni(this.filters)
      .pipe(finalize(() => { 
        this.loading = false; 
        this.searching = false; 
        this.cdr.markForCheck(); 
      }))
      .subscribe({
        next: list => { 
          this.alumni = list ?? []; 
          this.page = 0;
          this.errorMessage = '';
        },
        error: () => { this.errorMessage = 'Could not load alumni directory. Please retry.'; }
      });
  }

  clearFilters(): void {
    this.filters = {};
    this.runSearch();
  }

  exportAlumni(): void {
    alert('Export triggered. File will be downloaded shortly.');
  }

  viewProfile(studentId?: number | null): void {
    if (studentId) {
      this.router.navigate(['/app/students/profile', studentId]);
    }
  }

  openLinkedIn(url?: string | null): void {
    if (url) window.open(url, '_blank');
  }

  emailAlumni(email?: string | null): void {
    if (email) window.open(`mailto:${email}`, '_self');
  }

  callAlumni(contact?: string | null): void {
    if (contact) window.open(`tel:${contact}`, '_self');
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }
}
