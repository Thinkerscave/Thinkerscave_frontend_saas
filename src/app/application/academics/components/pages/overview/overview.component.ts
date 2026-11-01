import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicsOverviewApiService } from '../../../services/academics-overview-api.service';
import { AcademicsOverview, ACADEMICS_OVERVIEW_RESOURCE } from '../../../models/academics-overview.model';
import { subjectTypeLabel, SubjectType } from '../../../models/subjects-mapping.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-academics-overview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, ProgressBarModule, SaasPageHeaderComponent, TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class AcademicsOverviewPageComponent {
  private readonly api = inject(AcademicsOverviewApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_OVERVIEW_RESOURCE;
  readonly subjectTypeLabel = (type: string | undefined) => subjectTypeLabel(type as SubjectType | undefined);
  loading = true;
  selectedYearId: number | null = null;
  overview: AcademicsOverview | null = null;
  snapshotTab: 'academicGroups' | 'subjects' = 'academicGroups';

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (yearId == null) {
      this.overview = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
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

  stepRoute(code: string): string {
    switch (code) {
      case 'YEAR': return '/app/academics/academic-year';
      case 'ACADEMIC_GROUPS': return '/app/academics/academic-groups';
      case 'SUBJECTS': return '/app/academics/subjects';
      case 'MAPPING': return '/app/academics/subject-mapping';
      case 'ALLOCATION': return '/app/academics/teacher-allocation';
      case 'TIMETABLE': return '/app/academics/timetable';
      default: return '/app/academics/academic-year';
    }
  }

  continueSetupRoute(ov: AcademicsOverview): string {
    const next = (ov.readinessSteps || []).find((step) => step.state !== 'COMPLETE');
    return next ? this.stepRoute(next.code) : '/app/academics/timetable';
  }

  stepIcon(state: string): string {
    if (state === 'COMPLETE') return 'pi pi-check-circle';
    if (state === 'IN_PROGRESS') return 'pi pi-spin pi-spinner';
    return 'pi pi-circle';
  }

  timetableHeadline(ov: AcademicsOverview): string {
    if ((ov.timetable.openBlockingConflicts || 0) > 0) return 'Needs Attention';
    if (ov.timetable.publishedVersion) {
      return ov.timetable.status && ov.timetable.status !== 'PUBLISHED'
        ? 'Published - newer draft in review'
        : 'Timetable Published';
    }
    return this.friendlyStatus(ov.timetable.status);
  }

  friendlyStatus(status?: string | null): string {
    if (!status) return 'Not started';
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      READY_FOR_REVIEW: 'Ready for review',
      PENDING_APPROVAL: 'Pending approval',
      APPROVED: 'Approved',
      PUBLISHED: 'Published',
      SUPERSEDED: 'Superseded',
      ARCHIVED: 'Archived',
      NOT_GENERATED: 'Not generated'
    };
    return labels[status] ?? status.replace(/_/g, ' ').toLowerCase();
  }

  donutStyle(ov: AcademicsOverview): Record<string, string> {
    const rows = ov.studentsByAcademicGroup || [];
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
