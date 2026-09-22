import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { ACADEMICS_MY_CLASSES_RESOURCE, TeacherMyClasses } from '../../../models/academics-me.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-my-classes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, SaasPageHeaderComponent, TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.scss']
})
export class MyClassesPageComponent {
  private readonly api = inject(AcademicsMeApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_MY_CLASSES_RESOURCE;
  loading = true;
  refreshing = false;
  hasLoaded = false;
  selectedYearId: number | null = null;
  data: TeacherMyClasses | null = null;
  q = '';
  viewMode: 'list' | 'grid' = 'list';

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (yearId == null) {
      this.data = null;
      this.loading = false;
      this.hasLoaded = true;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    if (this.hasLoaded) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.api.myClasses(this.selectedYearId)
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (d) => {
          this.data = d;
          this.hasLoaded = true;
        },
        error: (err) => {
          this.hasLoaded = true;
          this.messages.add({ severity: 'error', summary: 'Unable to load classes', detail: err?.error?.message });
        }
      });
  }

  get filteredClasses() {
    const list = this.data?.classes || [];
    const q = this.q.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      `${c.className} ${c.sectionName} ${c.classCode || ''} ${c.subjects.map((s) => s.subjectName).join(' ')}`.toLowerCase().includes(q));
  }

  shortCode(c: TeacherMyClasses['classes'][number]): string {
    if (c.classCode) return c.classCode;
    const cls = (c.className || '').replace(/class\s*/i, '').trim();
    return `${cls || '?'}-${c.sectionName || ''}`.slice(0, 6);
  }

  periodSum(c: TeacherMyClasses['classes'][number]): number {
    return (c.subjects || []).reduce((sum, s) => sum + (s.weeklyPeriods || 0), 0);
  }
}
