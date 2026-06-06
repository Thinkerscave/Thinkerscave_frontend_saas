import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  AchievementRequest,
  AchievementResponse,
  StudentProfile360,
  StudentTimelineEntry
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

type ProfileTab =
  | 'OVERVIEW'
  | 'PERSONAL'
  | 'FAMILY'
  | 'ACADEMICS'
  | 'DOCUMENTS'
  | 'ATTENDANCE'
  | 'FEES'
  | 'MEDICAL'
  | 'PORTFOLIO'
  | 'TIMELINE';

@Component({
  selector: 'app-student-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './student-profile-360.component.html'
})
export class StudentProfile360Component implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  studentId!: number;
  loading = true;
  errorMessage = '';

  profile?: StudentProfile360;
  timeline: StudentTimelineEntry[] = [];
  achievements: AchievementResponse[] = [];

  activeTab: ProfileTab = 'OVERVIEW';
  readonly tabs: { key: ProfileTab; label: string; icon: string }[] = [
    { key: 'OVERVIEW',   label: 'Overview',   icon: 'pi pi-th-large' },
    { key: 'PERSONAL',   label: 'Personal',   icon: 'pi pi-id-card' },
    { key: 'FAMILY',     label: 'Family',     icon: 'pi pi-users' },
    { key: 'ACADEMICS',  label: 'Academics',  icon: 'pi pi-book' },
    { key: 'DOCUMENTS',  label: 'Documents',  icon: 'pi pi-file' },
    { key: 'ATTENDANCE', label: 'Attendance', icon: 'pi pi-calendar-times' },
    { key: 'FEES',       label: 'Fees',       icon: 'pi pi-credit-card' },
    { key: 'MEDICAL',    label: 'Medical',    icon: 'pi pi-heart' },
    { key: 'PORTFOLIO',  label: 'Portfolio',  icon: 'pi pi-star' },
    { key: 'TIMELINE',   label: 'Timeline',   icon: 'pi pi-history' }
  ];

  newAchievement: AchievementRequest = { category: 'ACADEMIC', title: '' };
  savingAchievement = false;

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.studentId) {
      this.router.navigate(['/app/students/directory']);
      return;
    }
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      profile:      this.api.profile(this.studentId),
      timeline:     this.api.timeline(this.studentId),
      achievements: this.api.achievements(this.studentId)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ profile, timeline, achievements }) => {
          this.profile = profile;
          this.timeline = timeline;
          this.achievements = achievements;
        },
        error: () => { this.errorMessage = 'Unable to load student profile. Please retry.'; }
      });
  }

  go(tab: ProfileTab): void { this.activeTab = tab; }

  back(): void { this.router.navigate(['/app/students/directory']); }

  initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  /** SVG donut for attendance % */
  ringDash(): { circ: number; offset: number } {
    const r = 48;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, this.profile?.attendance.percent ?? 0));
    const offset = circ - (circ * pct) / 100;
    return { circ, offset };
  }

  feePercent(): number {
    if (!this.profile?.fees) return 0;
    const t = this.profile.fees.totalFee;
    if (!t) return 0;
    return Math.round((this.profile.fees.paid / t) * 100);
  }

  addAchievement(): void {
    if (!this.newAchievement.title || !this.newAchievement.category) return;
    this.savingAchievement = true;
    this.api.addAchievement(this.studentId, this.newAchievement)
      .pipe(finalize(() => { this.savingAchievement = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          this.achievements = [created, ...this.achievements];
          this.newAchievement = { category: 'ACADEMIC', title: '' };
        },
        error: () => { this.errorMessage = 'Could not add achievement. Please retry.'; }
      });
  }
}
