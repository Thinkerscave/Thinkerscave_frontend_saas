import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { AppListEmptyStateComponent } from '../../../../../shared/ui/app-list/app-empty-state.component';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { ACADEMICS_MY_TIMETABLE_RESOURCE, MyTimetable } from '../../../models/academics-me.model';
import { LoginService } from '../../../../../core/services/login.service';
import { roleTokensFromUser } from '../../../../../core/utils/workspace-home';

@Component({
  selector: 'app-my-timetable-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DropdownModule, SaasPageHeaderComponent, AppListEmptyStateComponent],
  templateUrl: './my-timetable.component.html',
  styleUrls: ['./my-timetable.component.scss']
})
export class MyTimetablePageComponent implements OnInit {
  private readonly api = inject(AcademicsMeApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly login = inject(LoginService);

  readonly resource = ACADEMICS_MY_TIMETABLE_RESOURCE;
  loading = true;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  data: MyTimetable | null = null;
  viewMode: 'week' | 'day' = 'week';
  classFilter = '';
  subjectFilter = '';

  private readonly palette = ['#dbeafe', '#dcfce7', '#fce7f3', '#ffedd5', '#ede9fe', '#e0f2fe', '#fef3c7'];

  ngOnInit(): void {
    this.yearApi.search(undefined, undefined, { skipErrorToast: true }).subscribe({
      next: (years) => {
        this.years = years;
        this.selectedYearId = (years.find((y) => y.status === 'CURRENT') ?? years[0])?.academicYearId ?? null;
        this.reload();
      },
      error: () => {
        this.years = [];
        this.selectedYearId = null;
        this.reload();
      }
    });
  }

  reload(): void {
    this.loading = true;
    this.api.myTimetable(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (d) => this.data = d,
        error: (err) => this.messages.add({ severity: 'error', summary: 'Unable to load timetable', detail: err?.error?.message })
      });
  }

  get hasGrid(): boolean {
    return (this.data?.grid?.periods?.length ?? 0) > 0;
  }

  get isStudentViewer(): boolean {
    return this.data?.role === 'STUDENT' || roleTokensFromUser(this.login.getUser()).includes('STUDENT');
  }

  get emptyDescription(): string {
    if (this.data?.message) {
      return this.data.message;
    }
    if (this.isStudentViewer) {
      return 'A published timetable is not available for your class yet. Check Academic Calendar for holidays and events, or try again after the school publishes the timetable.';
    }
    return 'There is no published timetable for your allocations this year. If you have no assigned classes, ask the academic coordinator to allocate you first.';
  }

  openFallback(): void {
    const target = this.isStudentViewer
      ? '/app/academics/my-academics'
      : '/app/academics/my-classes';
    void this.router.navigateByUrl(target);
  }

  get todayName(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  }

  get classOptions(): string[] {
    const cells = this.data?.grid?.cells || [];
    return [...new Set(cells.map((c) => [c.className, c.sectionName].filter(Boolean).join('-')).filter(Boolean))];
  }

  get subjectOptions(): string[] {
    const cells = this.data?.grid?.cells || [];
    return [...new Set(cells.map((c) => c.subjectName).filter(Boolean) as string[])];
  }

  get summary() {
    const today = this.data?.todaySchedule || [];
    const teaching = today.filter((t) => !!t.subjectName).length;
    const classes = new Set((this.data?.grid?.cells || []).map((c) => `${c.className}-${c.sectionName}`)).size;
    const subjects = new Set((this.data?.grid?.cells || []).map((c) => c.subjectName).filter(Boolean)).size;
    const periods = this.data?.grid?.periods?.filter((p) => p.slotKind !== 'BREAK').length || 0;
    return {
      classesToday: teaching,
      teachingPeriods: `${teaching} / ${periods || teaching || 0}`,
      freePeriods: Math.max(0, periods - teaching),
      classes,
      subjects
    };
  }

  visibleDays(): string[] {
    const days = this.data?.grid?.workingDays || [];
    if (this.viewMode === 'day') {
      const today = this.todayName;
      return days.includes(today) ? [today] : days.slice(0, 1);
    }
    return days;
  }

  isToday(day: string): boolean {
    return day === this.todayName;
  }

  cell(day: string, periodNumber: number) {
    const cell = this.data?.grid?.cells?.find(
      (c) => c.dayOfWeek === day && c.periodNumber === periodNumber
    );
    if (!cell) return null;
    if (this.classFilter) {
      const label = [cell.className, cell.sectionName].filter(Boolean).join('-');
      if (label !== this.classFilter) return null;
    }
    if (this.subjectFilter && cell.subjectName !== this.subjectFilter) return null;
    return cell;
  }

  cellStyle(subject?: string | null): Record<string, string> {
    if (!subject) return { background: '#f8fafc', color: '#94a3b8' };
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = (hash + subject.charCodeAt(i) * (i + 1)) % this.palette.length;
    return { background: this.palette[hash] };
  }

  isCurrent(start?: string | null, end?: string | null): boolean {
    if (!start || !end) return false;
    const now = new Date();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= sh * 60 + sm && mins <= eh * 60 + em;
  }
}
