import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  AcademicHistoryRow,
  MedicalSnapshot,
  StudentDocumentEntry,
  StudentPersonal,
  StudentProfile360,
  StudentTimelineEntry
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

type ProfileTab = 'OVERVIEW' | 'PERSONAL' | 'FAMILY' | 'ACADEMICS' | 'DOCUMENTS' | 'MEDICAL' | 'TIMELINE';
type TimelineFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

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
  academicHistory: AcademicHistoryRow[] = [];
  studentDocs: StudentDocumentEntry[] = [];

  activeTab: ProfileTab = 'OVERVIEW';
  readonly tabs: { key: ProfileTab; label: string; icon: string }[] = [
    { key: 'OVERVIEW',   label: 'Overview',   icon: 'pi pi-th-large' },
    { key: 'PERSONAL',   label: 'Personal',   icon: 'pi pi-id-card' },
    { key: 'FAMILY',     label: 'Family',     icon: 'pi pi-users' },
    { key: 'ACADEMICS',  label: 'Academics',  icon: 'pi pi-book' },
    { key: 'DOCUMENTS',  label: 'Documents',  icon: 'pi pi-file' },
    { key: 'MEDICAL',    label: 'Medical',    icon: 'pi pi-heart' },
    { key: 'TIMELINE',   label: 'Timeline',   icon: 'pi pi-history' }
  ];

  // ---- Header Menu ----
  moreActionsOpen = false;

  // ---- Inline Edit States ----
  editingPersonal = false;
  editingMedical = false;
  personalForm: Partial<StudentPersonal> = {};
  medicalForm: Partial<MedicalSnapshot> = {};

  // ---- Timeline Filter ----
  timelineFilter: TimelineFilter = 'ALL';

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.studentId) {
      this.router.navigate(['/app/students/directory']);
      return;
    }
    
    // Check if query param requests a specific tab
    const qTab = this.route.snapshot.queryParamMap.get('tab') as ProfileTab;
    if (qTab && this.tabs.some(t => t.key === qTab)) {
      this.activeTab = qTab;
    }

    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      profile:      this.api.profile(this.studentId),
      timeline:     this.api.timelineMock(this.studentId), // MOCK fallback
      history:      this.api.academicHistory(this.studentId), // MOCK fallback
      docs:         this.api.studentDocuments(this.studentId) // MOCK fallback
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ profile, timeline, history, docs }) => {
          this.profile = profile;
          this.timeline = timeline;
          this.academicHistory = history;
          this.studentDocs = docs;
        },
        error: () => { this.errorMessage = 'Unable to load student profile. Please retry.'; }
      });
  }

  go(tab: ProfileTab): void { 
    this.activeTab = tab;
    // reset edit states when switching tabs
    this.editingPersonal = false;
    this.editingMedical = false;
  }

  back(): void { this.router.navigate(['/app/students/directory']); }

  // ---- Header Actions ----
  toggleMoreActions(event: Event): void {
    event.stopPropagation();
    this.moreActionsOpen = !this.moreActionsOpen;
  }

  closeMenus(): void {
    this.moreActionsOpen = false;
  }

  transferStudent(): void {
    this.router.navigate(['/app/students/transfers']);
  }

  // ---- Personal Edit ----
  startEditPersonal(): void {
    if (!this.profile) return;
    this.personalForm = { ...this.profile.personal };
    this.editingPersonal = true;
  }

  cancelEditPersonal(): void {
    this.editingPersonal = false;
  }

  savePersonal(): void {
    this.api.updatePersonal(this.studentId, this.personalForm).subscribe({
      next: (res) => {
        if (this.profile) this.profile.personal = res;
        this.editingPersonal = false;
        this.cdr.markForCheck();
      },
      error: () => { this.errorMessage = 'Failed to save personal info.'; }
    });
  }

  // ---- Medical Edit ----
  startEditMedical(): void {
    if (!this.profile) return;
    this.medicalForm = { ...this.profile.medical };
    this.editingMedical = true;
  }

  cancelEditMedical(): void {
    this.editingMedical = false;
  }

  saveMedical(): void {
    this.api.updateMedical(this.studentId, this.medicalForm).subscribe({
      next: () => {
        if (this.profile) this.profile.medical = { ...this.profile.medical, ...this.medicalForm };
        this.editingMedical = false;
        this.cdr.markForCheck();
      },
      error: () => { this.errorMessage = 'Failed to save medical info.'; }
    });
  }

  // ---- Timeline Filter ----
  setTimelineFilter(filter: TimelineFilter): void {
    this.timelineFilter = filter;
    // MOCK filtering client-side for now
  }

  get filteredTimeline(): StudentTimelineEntry[] {
    // In real app, might fetch from server with date ranges.
    // For MOCK, just returning all for now.
    return this.timeline;
  }

  // ---- Helpers ----
  initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  /** SVG donut for attendance % */
  ringDash(): { circ: number; offset: number } {
    const r = 48;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, this.profile?.attendance?.percent ?? 0));
    const offset = circ - (circ * pct) / 100;
    return { circ, offset };
  }

  feePercent(): number {
    if (!this.profile?.fees) return 0;
    const t = this.profile.fees.totalFee;
    if (!t) return 0;
    return Math.round((this.profile.fees.paid / t) * 100);
  }
}
