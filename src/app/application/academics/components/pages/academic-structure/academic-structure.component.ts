import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE, TeacherAcademicStructure } from '../../../models/academics-me.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-academic-structure-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, SaasPageHeaderComponent, TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './academic-structure.component.html',
  styleUrls: ['./academic-structure.component.scss']
})
export class AcademicStructurePageComponent {
  private readonly api = inject(AcademicsMeApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE;
  loading = true;
  selectedYearId: number | null = null;
  selectedClassId: number | null = null;
  data: TeacherAcademicStructure | null = null;

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (yearId == null) {
      this.data = null;
      this.selectedClassId = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    this.loading = true;
    this.api.myStructure(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (d) => {
          this.data = d;
          this.selectedClassId = d.classes?.[0]?.classId ?? null;
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Unable to load structure', detail: err?.error?.message })
      });
  }

  get selectedClass() {
    return this.data?.classes?.find((c) => c.classId === this.selectedClassId) || null;
  }

  get sectionCount(): number {
    return (this.data?.classes || []).reduce((n, c) => n + (c.sections?.length || 0), 0);
  }

  get subjectCount(): number {
    const ids = new Set<number>();
    for (const c of this.data?.classes || []) {
      for (const s of c.sections || []) {
        for (const sub of s.subjects || []) ids.add(sub.subjectId);
      }
    }
    return ids.size;
  }

  subjectCountFor(c: TeacherAcademicStructure['classes'][number]): number {
    const ids = new Set<number>();
    for (const s of c.sections || []) {
      for (const sub of s.subjects || []) ids.add(sub.subjectId);
    }
    return ids.size;
  }
}
