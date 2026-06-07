import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  AttendanceStatusToday,
  StudentCreateRequest,
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

interface SelectOption {
  id: number;
  label: string;
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
  showImport = false;
  importCsv = 'firstName,lastName,email,mobileNumber,gender,dateOfBirth,classId,sectionId,rollNumber,guardianFirstName,guardianLastName,guardianPhoneNumber\nAarav,Mehta,aarav.mehta@student.thinkerscave.com,9988811101,Male,2012-08-14,1,1,21,Rajesh,Mehta,9988811199';
  importError = '';
  importSuccess = '';
  importing = false;

  kpi: StudentKpi = {
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    newAdmissionsThisYear: 0,
    alumniCount: 0
  };

  students: StudentDirectoryCard[] = [];
  allStudents: StudentDirectoryCard[] = [];
  classOptions: SelectOption[] = [];
  sectionOptions: SelectOption[] = [];

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
        next: ({ kpi, list }) => {
          this.kpi = kpi;
          this.students = list;
          this.allStudents = list;
          this.refreshOptions();
        },
        error: () => { this.errorMessage = 'Unable to load students. Please retry.'; }
      });
  }

  runSearch(): void {
    this.searching = true;
    this.api.search(this.filter)
      .pipe(finalize(() => { this.searching = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => {
          this.students = list;
          if (!this.hasActiveFilters()) {
            this.allStudents = list;
          }
          this.refreshOptions();
          this.errorMessage = '';
        },
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

  refreshOptions(): void {
    const source = [...this.allStudents, ...this.students];
    this.classOptions = this.uniqueOptions(source, 'classId', 'className');
    const classId = this.filter.classId ? Number(this.filter.classId) : null;
    this.sectionOptions = this.uniqueOptions(
      source.filter(s => !classId || s.classId === classId),
      'sectionId',
      'sectionName'
    );
  }

  onClassChanged(): void {
    this.filter.sectionId = null;
    this.refreshOptions();
  }

  openImport(): void {
    this.importError = '';
    this.importSuccess = '';
    this.showImport = true;
  }

  closeImport(): void {
    this.showImport = false;
  }

  importStudents(): void {
    const rows = this.parseImportRows();
    if (!rows.length || this.importError) {
      return;
    }
    this.importing = true;
    forkJoin(rows.map(row => this.api.createStudent(row)))
      .pipe(finalize(() => { this.importing = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.importSuccess = `${rows.length} student(s) imported.`;
          this.closeImport();
          this.loadAll();
        },
        error: () => { this.importError = 'Import failed. Check duplicate email/roll number or required fields.'; }
      });
  }

  openProfile(s: StudentDirectoryCard): void {
    this.router.navigate(['/app/students/profile', s.studentId]);
  }

  addStudent(): void {
    this.router.navigate(['/app/admissions/admission-center']);
  }

  private hasActiveFilters(): boolean {
    return Boolean(this.filter.keyword || this.filter.classId || this.filter.sectionId || this.filter.status || this.filter.parentName);
  }

  private uniqueOptions(rows: StudentDirectoryCard[], idKey: 'classId' | 'sectionId', labelKey: 'className' | 'sectionName'): SelectOption[] {
    const byId = new Map<number, string>();
    rows.forEach(row => {
      const id = row[idKey];
      const label = row[labelKey];
      if (id != null && label && !byId.has(id)) {
        byId.set(id, label);
      }
    });
    return Array.from(byId.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }

  private parseImportRows(): StudentCreateRequest[] {
    this.importError = '';
    const lines = this.importCsv.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      this.importError = 'Paste a header row and at least one student row.';
      return [];
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const required = ['firstName', 'lastName', 'email', 'mobileNumber', 'classId', 'sectionId', 'guardianFirstName', 'guardianLastName', 'guardianPhoneNumber'];
    const missing = required.filter(key => !headers.includes(key));
    if (missing.length) {
      this.importError = `Missing columns: ${missing.join(', ')}`;
      return [];
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row = headers.reduce<Record<string, string>>((acc, key, i) => ({ ...acc, [key]: values[i] ?? '' }), {});
      required.forEach(key => {
        if (!row[key]) {
          this.importError = `Row ${index + 2} is missing ${key}.`;
        }
      });
      return {
        firstName: row['firstName'],
        lastName: row['lastName'],
        email: row['email'],
        mobileNumber: row['mobileNumber'],
        gender: row['gender'] || null,
        dateOfBirth: row['dateOfBirth'] || null,
        enrollmentDate: row['enrollmentDate'] || new Date().toISOString().substring(0, 10),
        rollNumber: row['rollNumber'] || null,
        classId: Number(row['classId']),
        sectionId: Number(row['sectionId']),
        isSameAddress: true,
        currentCountry: row['currentCountry'] || 'India',
        currentState: row['currentState'] || 'Karnataka',
        currentCity: row['currentCity'] || 'Bangalore',
        currentZipCode: row['currentZipCode'] || '560001',
        currentAddressLine: row['currentAddressLine'] || 'Imported address',
        permanentCountry: row['permanentCountry'] || row['currentCountry'] || 'India',
        permanentState: row['permanentState'] || row['currentState'] || 'Karnataka',
        permanentCity: row['permanentCity'] || row['currentCity'] || 'Bangalore',
        permanentZipCode: row['permanentZipCode'] || row['currentZipCode'] || '560001',
        permanentAddressLine: row['permanentAddressLine'] || row['currentAddressLine'] || 'Imported address',
        guardianFirstName: row['guardianFirstName'],
        guardianLastName: row['guardianLastName'],
        guardianRelation: row['guardianRelation'] || 'Guardian',
        guardianEmail: row['guardianEmail'] || `parent.${row['guardianPhoneNumber']}@thinkerscave.local`,
        guardianPhoneNumber: row['guardianPhoneNumber'],
        guardianAddress: row['guardianAddress'] || row['currentAddressLine'] || 'Imported address'
      };
    });
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
