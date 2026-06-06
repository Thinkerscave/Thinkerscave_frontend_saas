import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  AttendanceStatusToday,
  StudentDirectoryCard,
  StudentKpi,
  StudentSearchRequest
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

interface KpiTile {
  key: keyof StudentKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  filter?: Partial<StudentSearchRequest>;
}

@Component({
  selector: 'app-students-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './students-directory.component.html'
})
export class StudentsDirectoryComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  searching = false;
  errorMessage = '';

  view: 'grid' | 'list' = 'grid';

  kpi: StudentKpi = {
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    newAdmissionsThisYear: 0,
    alumniCount: 0
  };

  students: StudentDirectoryCard[] = [];

  filter: StudentSearchRequest = {};
  activeKpi: keyof StudentKpi | null = null;

  readonly kpiTiles: KpiTile[] = [
    { key: 'totalStudents',         label: 'Total Students',  hint: 'Across all classes',      tone: 'info' },
    { key: 'activeStudents',        label: 'Active',          hint: 'Currently enrolled',      tone: 'success', filter: { status: 'ACTIVE' } },
    { key: 'newAdmissionsThisYear', label: 'New Admissions',  hint: 'Current academic year',   tone: 'success' },
    { key: 'inactiveStudents',      label: 'Inactive',        hint: 'Disabled or left',        tone: 'warning', filter: { status: 'INACTIVE' } },
    { key: 'alumniCount',           label: 'Alumni',          hint: 'Past graduates',          tone: 'neutral' }
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      kpi:  this.api.kpi(),
      list: this.api.search(this.filter)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, list }) => { this.kpi = kpi; this.students = list; },
        error: () => { this.errorMessage = 'Unable to load students. Please retry.'; }
      });
  }

  runSearch(): void {
    this.searching = true;
    this.api.search(this.filter)
      .pipe(finalize(() => { this.searching = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => { this.students = list; this.errorMessage = ''; },
        error: () => { this.errorMessage = 'Search failed. Please retry.'; }
      });
  }

  toggleKpiFilter(tile: KpiTile): void {
    if (tile.key === 'alumniCount') {
      this.router.navigate(['/app/students/alumni']);
      return;
    }
    if (this.activeKpi === tile.key) {
      this.activeKpi = null;
      this.filter = {};
    } else {
      this.activeKpi = tile.key;
      this.filter = { ...this.filter, ...(tile.filter ?? {}) };
    }
    this.runSearch();
  }

  clearFilters(): void {
    this.filter = {};
    this.activeKpi = null;
    this.runSearch();
  }

  openProfile(s: StudentDirectoryCard): void {
    this.router.navigate(['/app/students/profile', s.studentId]);
  }

  addStudent(): void {
    this.router.navigate(['/app/admissions/admission-center']);
  }

  callPhone(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    if (s.mobile) window.open(`tel:${s.mobile}`, '_self');
  }
  whatsapp(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    if (s.mobile) window.open(`https://wa.me/${(s.mobile || '').replace(/\D/g, '')}`, '_blank');
  }
  emailContact(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    if (s.email) window.open(`mailto:${s.email}`, '_self');
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  presenceLabel(s: AttendanceStatusToday): string {
    return s === 'PRESENT_TODAY' ? 'Present today'
         : s === 'ABSENT_TODAY'  ? 'Absent today'
         : 'Not marked';
  }
}
