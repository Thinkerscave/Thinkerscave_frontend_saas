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
import { ACADEMICS_MY_CLASSES_RESOURCE, TeacherMyClasses } from '../../../models/academics-me.model';

@Component({
  selector: 'app-my-classes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DropdownModule, ToastModule],
  providers: [MessageService],
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.scss']
})
export class MyClassesPageComponent implements OnInit {
  private readonly api = inject(AcademicsMeApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_MY_CLASSES_RESOURCE;
  loading = true;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  data: TeacherMyClasses | null = null;
  q = '';
  viewMode: 'list' | 'grid' = 'list';

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
    this.api.myClasses(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (d) => this.data = d,
        error: (err) => this.messages.add({ severity: 'error', summary: 'Unable to load classes', detail: err?.error?.message })
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
