import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { ACADEMICS_MY_ACADEMIC_GROUPS_RESOURCE, TeacherMyAcademicGroups } from '../../../models/academics-me.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-my-academic-groups-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, SaasPageHeaderComponent, TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './my-academic-groups.component.html',
  styleUrls: ['./my-academic-groups.component.scss']
})
export class MyAcademicGroupsPageComponent {
  private readonly api = inject(AcademicsMeApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_MY_ACADEMIC_GROUPS_RESOURCE;
  loading = true;
  refreshing = false;
  hasLoaded = false;
  accessNotice: string | null = null;
  selectedYearId: number | null = null;
  data: TeacherMyAcademicGroups | null = null;
  q = '';
  viewMode: 'list' | 'grid' = 'list';

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (yearId == null) {
      this.data = null;
      this.loading = false;
      this.hasLoaded = true;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    if (this.hasLoaded) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.api.myAcademicGroups(this.selectedYearId)
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (d) => {
          this.data = d;
          this.hasLoaded = true;
        },
        error: (err) => {
          this.hasLoaded = true;
          const message = String(err?.error?.message || '');
          if (/profile required/i.test(message)) {
            this.accessNotice = 'This page is available to staff accounts. Sign in with a staff login to see your assigned academic groups.';
          } else {
            this.accessNotice = 'Academic groups could not be loaded right now.';
            this.messages.add({ severity: 'error', summary: 'Unable to load Academic Groups', detail: message });
          }
        }
      });
  }

  get filteredAcademicGroups() {
    const list = this.data?.academicGroups || [];
    const q = this.q.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      `${c.academicGroupName} ${c.sectionName} ${c.academicGroupCode || ''} ${c.subjects.map((s) => s.subjectName).join(' ')}`.toLowerCase().includes(q));
  }

  shortCode(c: TeacherMyAcademicGroups['academicGroups'][number]): string {
    if (c.academicGroupCode) return c.academicGroupCode;
    const groupName = (c.academicGroupName || '').trim();
    return `${groupName || '?'}-${c.sectionName || ''}`.slice(0, 6);
  }

  periodSum(c: TeacherMyAcademicGroups['academicGroups'][number]): number {
    return (c.subjects || []).reduce((sum, s) => sum + (s.weeklyPeriods || 0), 0);
  }
}
