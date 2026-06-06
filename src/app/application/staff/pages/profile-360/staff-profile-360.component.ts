import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize, forkJoin } from 'rxjs';

import {
  StaffProfile360,
  StaffTimelineEntry,
  TeachingProfileRequest
} from '../../models/staff-workspace.model';
import { StaffWorkspaceService } from '../../services/staff-workspace.service';

type Tab = 'overview' | 'personal' | 'employment' | 'teaching' | 'responsibilities'
         | 'documents' | 'leave' | 'payroll' | 'timeline';

@Component({
  selector: 'app-staff-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../staff.shared.scss'],
  templateUrl: './staff-profile-360.component.html'
})
export class StaffProfile360Component implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly api = inject(StaffWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);

  loading = true;
  saving = false;
  errorMessage = '';

  staffId = 0;
  profile?: StaffProfile360;
  timeline: StaffTimelineEntry[] = [];

  activeTab: Tab = 'overview';

  readonly tabs: { value: Tab; label: string; icon: string }[] = [
    { value: 'overview',         label: 'Overview',         icon: 'pi pi-user' },
    { value: 'personal',         label: 'Personal',         icon: 'pi pi-id-card' },
    { value: 'employment',       label: 'Employment',       icon: 'pi pi-briefcase' },
    { value: 'teaching',         label: 'Teaching Profile', icon: 'pi pi-book' },
    { value: 'responsibilities', label: 'Responsibilities', icon: 'pi pi-sitemap' },
    { value: 'documents',        label: 'Documents',        icon: 'pi pi-folder' },
    { value: 'leave',            label: 'Leave',            icon: 'pi pi-calendar-minus' },
    { value: 'payroll',          label: 'Payroll',          icon: 'pi pi-money-bill' },
    { value: 'timeline',         label: 'Timeline',         icon: 'pi pi-history' }
  ];

  // Editable teaching profile form
  teachingForm: TeachingProfileRequest = {
    staffId: 0,
    subjectsCanTeach: '',
    preferredSubjects: '',
    teachingLevels: '',
    canSubstituteFor: '',
    cannotSubstituteFor: '',
    qualification: '',
    experienceYears: 0,
    remarks: ''
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const id = Number(p.get('id'));
      if (!id) { this.errorMessage = 'Invalid employee id.'; this.loading = false; this.cdr.markForCheck(); return; }
      this.staffId = id;
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    forkJoin({
      profile: this.api.profile(this.staffId),
      timeline: this.api.timeline(this.staffId)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ profile, timeline }) => {
          this.profile = profile;
          this.timeline = timeline;
          this.teachingForm = {
            staffId: this.staffId,
            subjectsCanTeach: profile.teaching?.subjectsCanTeach ?? '',
            preferredSubjects: profile.teaching?.preferredSubjects ?? '',
            teachingLevels: profile.teaching?.teachingLevels ?? '',
            canSubstituteFor: profile.teaching?.canSubstituteFor ?? '',
            cannotSubstituteFor: profile.teaching?.cannotSubstituteFor ?? '',
            qualification: profile.teaching?.qualification ?? '',
            experienceYears: profile.teaching?.experienceYears ?? 0,
            remarks: profile.teaching?.remarks ?? ''
          };
        },
        error: () => { this.errorMessage = 'Unable to load profile.'; }
      });
  }

  initials(name?: string): string {
    if (!name) { return '?'; }
    return name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  back(): void { this.router.navigate(['/app/staff/directory']); }

  setTab(t: Tab): void { this.activeTab = t; }

  saveTeaching(): void {
    this.saving = true;
    this.api.saveTeachingProfile(this.teachingForm)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: snap => {
          if (this.profile) { this.profile.teaching = snap; }
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Teaching profile updated.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Unable to save teaching profile.' })
      });
  }

  trackByIdx(i: number): number { return i; }
}
