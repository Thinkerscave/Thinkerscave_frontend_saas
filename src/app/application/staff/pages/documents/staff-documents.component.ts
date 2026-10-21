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
import { StaffSummary } from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';

import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
@Component({
  selector: 'app-staff-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule,
    TcPageSkeletonComponent],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-documents.component.html'
})
export class StaffDocumentsComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';
  keyword = '';
  staff: StaffSummary[] = [];

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading = true;
    this.api.getStaffList({ page: 0, size: 200, sort: 'fullName,asc' })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (page) => {
          this.staff = page.content;
          this.errorMessage = '';
          this.loadPhotos(this.staff);
        },
        error: () => { this.errorMessage = 'Unable to load staff for document management.'; }
      });
  }

  private readonly photoUrls = new Map<number, string | null>();

  photoFor(s: StaffSummary): string | null {
    return this.photoUrls.get(s.staffId) ?? null;
  }

  private loadPhotos(items: StaffSummary[]): void {
    for (const s of items) {
      if (this.photoUrls.has(s.staffId)) {
        continue;
      }
      this.api.getPhotoObjectUrl(s.staffId).subscribe({
        next: url => { this.photoUrls.set(s.staffId, url); this.cdr.markForCheck(); },
        error: () => this.photoUrls.set(s.staffId, null)
      });
    }
  }

  filteredStaff(): StaffSummary[] {
    const q = this.keyword.trim().toLowerCase();
    if (!q) {
      return this.staff;
    }
    return this.staff.filter((s) =>
      s.fullName.toLowerCase().includes(q) ||
      s.staffCode.toLowerCase().includes(q)
    );
  }

  openDocuments(staff: StaffSummary): void {
    this.router.navigate(['/app/staff/profile', staff.staffId], { queryParams: { tab: 'documents' } });
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  trackByStaff(_: number, s: StaffSummary): number {
    return s.staffId;
  }
}
