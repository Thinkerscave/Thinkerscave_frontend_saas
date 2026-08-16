import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicsOverviewApiService } from '../../../services/academics-overview-api.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { AcademicsOverview, ACADEMICS_OVERVIEW_RESOURCE } from '../../../models/academics-overview.model';

@Component({
  selector: 'app-academics-overview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DropdownModule, ProgressBarModule, SaasPageHeaderComponent],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class AcademicsOverviewPageComponent implements OnInit {
  private readonly api = inject(AcademicsOverviewApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_OVERVIEW_RESOURCE;
  loading = true;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  overview: AcademicsOverview | null = null;
  snapshotTab: 'classes' | 'subjects' = 'classes';

  ngOnInit(): void {
    this.yearApi.search().subscribe({
      next: (years) => {
        this.years = years;
        const current = years.find((y) => y.status === 'CURRENT') ?? years[0] ?? null;
        this.selectedYearId = current?.academicYearId ?? null;
        if (this.selectedYearId) this.reload();
        else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Unable to load years' });
        this.cdr.markForCheck();
      }
    });
  }

  reload(): void {
    if (!this.selectedYearId) return;
    this.loading = true;
    this.api.getOverview(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (o) => this.overview = o,
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load overview',
          detail: err?.error?.message
        })
      });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  daysCompleted(ov: AcademicsOverview): number {
    if (ov.yearHeader.daysCompleted != null) return ov.yearHeader.daysCompleted;
    return this.deriveDays(ov).completed;
  }

  daysRemaining(ov: AcademicsOverview): number {
    if (ov.yearHeader.daysRemaining != null) return ov.yearHeader.daysRemaining;
    return this.deriveDays(ov).remaining;
  }

  totalDays(ov: AcademicsOverview): number {
    if (ov.yearHeader.totalDays != null) return ov.yearHeader.totalDays;
    return this.deriveDays(ov).total;
  }

  setupPercent(ov: AcademicsOverview): number {
    if (ov.setupCompletePercent != null) return ov.setupCompletePercent;
    const steps = ov.readinessSteps || [];
    if (!steps.length) return 0;
    const done = steps.filter((s) => s.state === 'COMPLETE').length;
    return Math.round((done * 100) / steps.length);
  }

  stepIcon(state: string): string {
    if (state === 'COMPLETE') return 'pi pi-check-circle';
    if (state === 'IN_PROGRESS') return 'pi pi-spin pi-spinner';
    return 'pi pi-circle';
  }

  timetableHeadline(ov: AcademicsOverview): string {
    if ((ov.timetable.openBlockingConflicts || 0) > 0) return 'Needs Attention';
    if (ov.timetable.status === 'PUBLISHED' || ov.timetable.publishedVersion) return 'Timetable Published';
    return ov.timetable.status || 'Not started';
  }

  donutStyle(ov: AcademicsOverview): Record<string, string> {
    const rows = ov.studentsByClass || [];
    if (!rows.length) return { background: '#e2e8f0' };
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#db2777', '#0891b2', '#64748b'];
    let cursor = 0;
    const parts: string[] = [];
    rows.forEach((r, i) => {
      const start = cursor;
      cursor += r.percent;
      parts.push(`${colors[i % colors.length]} ${start}% ${cursor}%`);
    });
    return { background: `conic-gradient(${parts.join(', ')})` };
  }

  private deriveDays(ov: AcademicsOverview): { completed: number; remaining: number; total: number } {
    const start = ov.yearHeader.startDate ? new Date(ov.yearHeader.startDate) : null;
    const end = ov.yearHeader.endDate ? new Date(ov.yearHeader.endDate) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { completed: 0, remaining: 0, total: 0 };
    }
    const ms = 24 * 60 * 60 * 1000;
    const total = Math.max(1, Math.round((end.getTime() - start.getTime()) / ms) + 1);
    const today = new Date();
    const capped = today > end ? end : today < start ? start : today;
    const completed = today < start ? 0 : Math.round((capped.getTime() - start.getTime()) / ms) + 1;
    const remaining = today > end ? 0 : Math.round((end.getTime() - today.getTime()) / ms);
    return { completed, remaining, total };
  }
}
