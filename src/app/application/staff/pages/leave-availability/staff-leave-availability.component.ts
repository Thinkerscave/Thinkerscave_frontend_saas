import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { LeaveAvailabilityKpi, TodayLeaveEntry } from '../../models/staff-workspace.model';
import { StaffWorkspaceService } from '../../services/staff-workspace.service';

interface KpiTile {
  key: keyof LeaveAvailabilityKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-staff-leave-availability',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../staff.shared.scss'],
  templateUrl: './staff-leave-availability.component.html'
})
export class StaffLeaveAvailabilityComponent implements OnInit {
  private readonly api = inject(StaffWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';

  kpi: LeaveAvailabilityKpi = { presentToday: 0, onLeaveToday: 0, absentToday: 0, upcomingLeaves: 0 };
  today: TodayLeaveEntry[] = [];

  activeTab: 'overview' | 'requests' | 'calendar' | 'types' = 'overview';

  readonly kpiTiles: KpiTile[] = [
    { key: 'presentToday',    label: 'Present Today',  hint: 'Working',         tone: 'success' },
    { key: 'onLeaveToday',    label: 'On Leave Today', hint: 'Approved',        tone: 'warning' },
    { key: 'absentToday',     label: 'Absent Today',   hint: 'Unscheduled',     tone: 'danger' },
    { key: 'upcomingLeaves',  label: 'Upcoming Leaves',hint: 'Next 7 Days',     tone: 'info' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    forkJoin({ kpi: this.api.leaveKpi(), today: this.api.todayLeaves() })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, today }) => { this.kpi = kpi; this.today = today; },
        error: () => { this.errorMessage = 'Unable to load leave data.'; }
      });
  }

  trackById(_: number, l: TodayLeaveEntry): number { return l.leaveId; }
}
