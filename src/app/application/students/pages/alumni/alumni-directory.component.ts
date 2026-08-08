import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs';

import { AlumniFilters, AlumniResponse } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

interface SelectOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-alumni-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './alumni-directory.component.html'
})
export class AlumniDirectoryComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  searching = false;
  errorMessage = '';

  filters: AlumniFilters = {};
  alumni: AlumniResponse[] = [];

  readonly passoutYears = ['2025', '2024', '2023', '2022', '2021', '2020', 'Before 2020'];
  readonly passoutYearOptions: SelectOption[] = [
    { label: 'All Years', value: null },
    ...this.passoutYears.map(y => ({ label: y, value: y }))
  ];

  ngOnInit(): void {
    this.runSearch();
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
