import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE, TeacherAcademicStructure } from '../../../models/academics-me.model';

@Component({
  selector: 'app-academic-structure-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DropdownModule, ToastModule],
  providers: [MessageService],
  templateUrl: './academic-structure.component.html',
  styleUrls: ['./academic-structure.component.scss']
})
export class AcademicStructurePageComponent implements OnInit {
  private readonly api = inject(AcademicsMeApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE;
  loading = true;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  selectedClassId: number | null = null;
  data: TeacherAcademicStructure | null = null;

  ngOnInit(): void {
    this.yearApi.search().subscribe({
      next: (years) => {
        this.years = years;
        this.selectedYearId = (years.find((y) => y.status === 'CURRENT') ?? years[0])?.academicYearId ?? null;
        this.reload();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  reload(): void {
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
