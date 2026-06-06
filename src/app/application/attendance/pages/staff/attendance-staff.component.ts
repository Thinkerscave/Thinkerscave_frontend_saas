import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  SaasPageHeaderComponent,
  SaasStatGridComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat
} from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import { AttendanceWorkspaceData, AttendanceRecord } from '../../../school-operations/models/school-operations.model';

interface LogRow { date: string; signIn?: string; signOut?: string; hours?: string; status: string; tone: string; }
interface ImpactRow { teacher: string; subject: string; affectedClasses: string[]; status: string; }

@Component({
  selector: 'app-attendance-staff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent],
  templateUrl: './attendance-staff.component.html',
  styleUrl: './attendance-staff.component.scss'
})
export class AttendanceStaffComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dataService = inject(SchoolOperationsDataService);

  data: AttendanceWorkspaceData = this.empty();
  loading = true;
  clock = new Date();
  private clockTimer?: any;

  meName = 'Rahul Sharma';
  meRole = 'Mathematics Teacher';
  meStatus: 'IN' | 'OUT' = 'OUT';
  meSignInTime?: string;

  constructor() {}

  ngOnInit(): void {
    this.refresh();
    this.clockTimer = setInterval(() => {
      this.clock = new Date();
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void { if (this.clockTimer) { clearInterval(this.clockTimer); } }

  get stats(): SaasStat[] {
    const present = this.data.todayStaffAttendance.filter(r => r.status === 'PRESENT').length;
    const leave = this.data.todayStaffAttendance.filter(r => r.status === 'ON_LEAVE' || r.status === 'EXCUSED').length;
    const late = this.data.todayStaffAttendance.filter(r => r.status === 'LATE').length;
    const absent = this.data.todayStaffAttendance.filter(r => r.status === 'ABSENT').length;
    const totalStaff = Math.max(this.data.staff.length, 1);
    return [
      { key: 'present', label: 'Present Today', value: present.toString(), helper: `${Math.round((present / totalStaff) * 100)}%`, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'leave', label: 'On Leave', value: leave.toString(), helper: `${Math.round((leave / totalStaff) * 100)}%`, icon: 'pi pi-calendar-minus', tone: 'warning' },
      { key: 'late', label: 'Late Arrivals', value: late.toString(), helper: `${Math.round((late / totalStaff) * 100)}%`, icon: 'pi pi-clock', tone: 'info' },
      { key: 'absent', label: 'Absent', value: absent.toString(), helper: `${Math.round((absent / totalStaff) * 100)}%`, icon: 'pi pi-user-minus', tone: 'danger' }
    ];
  }

  get clockTime(): string {
    return this.clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }
  get clockDate(): string {
    return this.clock.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });
  }

  signInOut(): void {
    if (this.meStatus === 'OUT') {
      this.meStatus = 'IN';
      this.meSignInTime = this.clockTime;
    } else {
      this.meStatus = 'OUT';
    }
  }

  get todayLog(): LogRow[] {
    return this.data.todayStaffAttendance.slice(0, 7).map(r => {
      const tone = r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'danger' : r.status === 'LATE' ? 'warning' : 'info';
      return {
        date: r.attendanceDate,
        signIn: r.status === 'ABSENT' ? '-' : '08:35 AM',
        signOut: r.status === 'ABSENT' ? '-' : '04:42 PM',
        hours: r.status === 'ABSENT' ? '-' : '08h 07m',
        status: this.statusLabel(r.status),
        tone
      };
    });
  }

  get absentTeacherImpact(): ImpactRow[] {
    return this.data.todayStaffAttendance
      .filter(r => r.status === 'ABSENT' && (r.department || '').toLowerCase().includes('science') || (r.department || '').toLowerCase().includes('math') || (r.department || '').toLowerCase().includes('english'))
      .slice(0, 3)
      .map(r => ({
        teacher: r.referenceName,
        subject: r.department || 'Subject Teacher',
        affectedClasses: ['Class 8 - B', 'Class 9 - A', 'Class 10 - A'],
        status: 'Pending'
      }));
  }

  refresh(): void {
    this.loading = true;
    this.dataService.loadAttendanceWorkspace()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: data => this.data = data, error: () => this.data = this.empty() });
  }

  private statusLabel(s: AttendanceRecord['status']): string {
    const map: Record<string, string> = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Leave', ON_LEAVE: 'Leave', WFH: 'WFH', HALF_DAY: 'Half Day', NIGHT_OUT: 'Night Out' };
    return map[s] || s;
  }

  private empty(): AttendanceWorkspaceData {
    return {
      today: this.dataService.today(), students: [], staff: [], classes: [], sections: [], departments: [], branches: [],
      todayClassAttendance: [], todayStaffAttendance: [], trends: []
    };
  }
}
