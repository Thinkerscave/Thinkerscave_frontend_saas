import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
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
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';

import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
type ProfileTab = 'OVERVIEW' | 'PERSONAL' | 'FAMILY' | 'ACADEMICS' | 'DOCUMENTS' | 'MEDICAL' | 'TIMELINE';
type TimelineFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

@Component({
  selector: 'app-student-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, AvatarComponent, SaasPageHeaderComponent,
    TcPageSkeletonComponent
  ],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './student-profile-360.component.html'
})
export class StudentProfile360Component implements OnInit, OnDestroy {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  studentId!: number;
  loading = true;
  errorMessage = '';
  avatarUrl: string | null = null;
  private avatarObjectUrl: string | null = null;

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

  moreActionsOpen = false;
  editingPersonal = false;
  editingMedical = false;
  personalForm: Partial<StudentPersonal> = {};
  medicalForm: Partial<MedicalSnapshot> = {};

  readonly genderOptions: { label: string; value: string }[] = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  readonly bloodGroupOptions: { label: string; value: string }[] = [
    { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' }
  ];

  timelineFilter: TimelineFilter = 'ALL';

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.studentId) {
      this.router.navigate(['/app/students/directory']);
      return;
    }
    const qTab = this.route.snapshot.queryParamMap.get('tab') as ProfileTab;
    if (qTab && this.tabs.some(t => t.key === qTab)) {
      this.activeTab = qTab;
    }
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.revokeAvatarUrl();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      profile:  this.api.profile(this.studentId),
      timeline: this.api.timeline(this.studentId),
      history:  this.api.academicHistory(this.studentId),
      docs:     this.api.studentDocuments(this.studentId)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ profile, timeline, history, docs }) => {
          this.profile = profile;
          this.timeline = timeline;
          this.academicHistory = history;
          this.studentDocs = docs;
          this.loadStudentPhoto(profile, docs);
        },
        error: () => { this.errorMessage = 'Unable to load student profile. Please retry.'; }
      });
  }

  private loadStudentPhoto(profile: StudentProfile360, docs: StudentDocumentEntry[]): void {
    const photoDocId =
      profile.overview.photoDocumentId
      ?? docs.find(d => d.documentType?.toUpperCase() === 'PHOTO')?.documentId
      ?? null;
    if (!photoDocId) {
      this.revokeAvatarUrl();
      this.avatarUrl = null;
      this.cdr.markForCheck();
      return;
    }
    this.api.downloadDocument(photoDocId).subscribe({
      next: (blob) => {
        this.revokeAvatarUrl();
        this.avatarObjectUrl = URL.createObjectURL(blob);
        this.avatarUrl = this.avatarObjectUrl;
        this.cdr.markForCheck();
      },
      error: () => {
        this.avatarUrl = null;
        this.cdr.markForCheck();
      }
    });
  }

  private revokeAvatarUrl(): void {
    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
      this.avatarObjectUrl = null;
    }
  }

  go(tab: ProfileTab): void {
    this.activeTab = tab;
    this.editingPersonal = false;
    this.editingMedical = false;
  }

  toggleMoreActions(event: Event): void {
    event.stopPropagation();
    this.moreActionsOpen = !this.moreActionsOpen;
  }

  closeMenus(): void { this.moreActionsOpen = false; }

  transferStudent(): void { this.router.navigate(['/app/students/transfers']); }

  startEditPersonal(): void {
    if (!this.profile) return;
    this.personalForm = { ...this.profile.personal };
    this.editingPersonal = true;
  }

  cancelEditPersonal(): void { this.editingPersonal = false; }

  savePersonal(): void {
    this.api.updatePersonal(this.studentId, this.personalForm).subscribe({
      next: (res) => {
        if (this.profile) this.profile.personal = { ...this.profile.personal, ...res };
        this.editingPersonal = false;
        this.cdr.markForCheck();
      },
      error: () => { this.errorMessage = 'Failed to save personal info.'; }
    });
  }

  startEditMedical(): void {
    if (!this.profile) return;
    this.medicalForm = { ...this.profile.medical };
    this.editingMedical = true;
  }

  cancelEditMedical(): void { this.editingMedical = false; }

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

  setTimelineFilter(filter: TimelineFilter): void { this.timelineFilter = filter; }

  get filteredTimeline(): StudentTimelineEntry[] {
    if (this.timelineFilter === 'ALL') return this.timeline;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cutoff =
      this.timelineFilter === 'TODAY' ? now - dayMs
      : this.timelineFilter === 'WEEK' ? now - 7 * dayMs
      : now - 30 * dayMs;
    return this.timeline.filter(t => {
      const ts = new Date(t.performedAt).getTime();
      return !Number.isNaN(ts) && ts >= cutoff;
    });
  }

  verifiedDocCount(): number {
    return this.studentDocs.filter(d => d.status === 'VERIFIED').length;
  }

  downloadDoc(doc: StudentDocumentEntry): void {
    if (!doc.documentId) return;
    this.api.downloadDocument(doc.documentId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.documentName || doc.displayLabel || 'document';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.errorMessage = 'Unable to download document.'; this.cdr.markForCheck(); }
    });
  }

  formatAddress(line1?: string | null, city?: string | null, state?: string | null, pin?: string | null): string {
    const parts = [line1, [city, state].filter(Boolean).join(', '), pin].filter(p => !!p && String(p).trim());
    return parts.length ? parts.join('\n') : '—';
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  dash(value?: string | number | null): string {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }
}
