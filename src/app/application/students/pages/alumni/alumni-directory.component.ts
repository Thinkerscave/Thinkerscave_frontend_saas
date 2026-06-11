import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlumniRequest, AlumniResponse } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

@Component({
  selector: 'app-alumni-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './alumni-directory.component.html'
})
export class AlumniDirectoryComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';
  search = '';

  alumni: AlumniResponse[] = [];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.alumni()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => { this.alumni = list ?? []; },
        error: () => { this.errorMessage = 'Could not load alumni.'; }
      });
  }

  filtered(): AlumniResponse[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.alumni;
    return this.alumni.filter(a =>
      (a.fullName + ' ' + (a.batchYear || '') + ' ' + (a.course || '') + ' ' + (a.occupation || '')).toLowerCase().includes(q));
  }



  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }
}
