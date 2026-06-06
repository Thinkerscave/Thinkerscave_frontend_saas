import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { StaffDirectoryCard, StaffKpi, StaffSearchRequest } from '../../models/staff-workspace.model';
import { StaffWorkspaceService } from '../../services/staff-workspace.service';

interface KpiTile {
  key: keyof StaffKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  filter?: Partial<StaffSearchRequest>;
}

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../staff.shared.scss'],
  templateUrl: './staff-directory.component.html'
})
export class StaffDirectoryComponent implements OnInit {
  private readonly api = inject(StaffWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  searching = false;
  errorMessage = '';

  view: 'grid' | 'list' = 'grid';

  kpi: StaffKpi = {
    totalEmployees: 0,
    teachingStaff: 0,
    nonTeachingStaff: 0,
    onLeaveToday: 0,
    newJoinersThisMonth: 0
  };

  staff: StaffDirectoryCard[] = [];

  filter: StaffSearchRequest = {};
  activeKpi: keyof StaffKpi | null = null;

  readonly kpiTiles: KpiTile[] = [
    { key: 'totalEmployees',      label: 'Total Employees',  hint: 'All Staff',         tone: 'info' },
    { key: 'teachingStaff',       label: 'Teaching Staff',   hint: 'Faculty',           tone: 'success', filter: { staffType: 'TEACHING' } },
    { key: 'nonTeachingStaff',    label: 'Non-Teaching',     hint: 'Administration',    tone: 'neutral', filter: { staffType: 'NON_TEACHING' } },
    { key: 'onLeaveToday',        label: 'On Leave Today',   hint: 'Approved leaves',   tone: 'warning' },
    { key: 'newJoinersThisMonth', label: 'New Joiners',      hint: 'This Month',        tone: 'success' }
  ];

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    forkJoin({ kpi: this.api.kpi(), list: this.api.search(this.filter) })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, list }) => { this.kpi = kpi; this.staff = list; },
        error: () => { this.errorMessage = 'Unable to load staff. Please retry.'; }
      });
  }

  runSearch(): void {
    this.searching = true;
    this.api.search(this.filter)
      .pipe(finalize(() => { this.searching = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => { this.staff = list; this.errorMessage = ''; },
        error: () => { this.errorMessage = 'Search failed. Please retry.'; }
      });
  }

  toggleKpiFilter(tile: KpiTile): void {
    if (this.activeKpi === tile.key) {
      this.activeKpi = null;
      this.filter = {};
    } else {
      this.activeKpi = tile.key;
      this.filter = { ...this.filter, ...(tile.filter ?? {}) };
    }
    this.runSearch();
  }

  initials(name: string): string {
    if (!name) { return '?'; }
    return name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  openProfile(card: StaffDirectoryCard): void {
    this.router.navigate(['/app/staff/profile', card.staffId]);
  }

  addStaff(): void {
    // Open registration in legacy staff workspace to leverage existing onboarding wizard.
    this.router.navigate(['/app/staff/directory'], { fragment: 'add' });
  }

  trackByStaff(_: number, item: StaffDirectoryCard): number { return item.staffId; }
}
