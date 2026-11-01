import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { ACADEMICS_MY_ACADEMICS_RESOURCE, StudentMyAcademics } from '../../../models/academics-me.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { LoginService } from '../../../../../core/services/login.service';
import { roleTokensFromUser } from '../../../../../core/utils/workspace-home';

@Component({
  selector: 'app-my-academics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, SaasPageHeaderComponent, TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './my-academics.component.html',
  styleUrls: ['./my-academics.component.scss']
})
export class MyAcademicsPageComponent implements OnInit {
  private readonly api = inject(AcademicsMeApiService);
  private readonly login = inject(LoginService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_MY_ACADEMICS_RESOURCE;
  readonly hasStudentRole = roleTokensFromUser(this.login.getUser()).includes('STUDENT');
  private readonly hasStudentOrParentRole = roleTokensFromUser(this.login.getUser())
    .some(role => role === 'STUDENT' || role === 'PARENT');
  loading = true;
  selectedYearId: number | null = null;
  data: StudentMyAcademics | null = null;
  accessNotice: string | null = null;

  ngOnInit(): void {
    if (this.hasStudentRole) {
      this.loadEnrolledStudentAcademics();
    }
  }

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (yearId == null) {
      this.data = null;
      this.accessNotice = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    if (!this.hasStudentOrParentRole) {
      this.data = null;
      this.accessNotice = 'This page is available to student and parent accounts. Sign in with a student login to see your academics.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.accessNotice = null;
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    if (!this.hasStudentOrParentRole) {
      this.accessNotice = 'This page is available to student and parent accounts. Sign in with a student login to see your academics.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.api.myAcademics(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (d) => this.data = d,
        error: (err) => {
        const message = String(err?.error?.message || '');
        if (/profile required/i.test(message)) {
          this.accessNotice = 'This page is available to student and parent accounts. Sign in with a student login to see your academics.';
        } else {
          this.accessNotice = 'Your academics could not be loaded right now.';
          this.messages.add({ severity: 'error', summary: 'Unable to load academics', detail: message });
        }
      }
      });
  }

  private loadEnrolledStudentAcademics(): void {
    this.loading = true;
    this.api.myAcademics()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (data) => {
          this.data = data;
          this.selectedYearId = data.academicYearId ?? null;
        },
        error: (err) => {
          const message = String(err?.error?.message || '');
          if (/profile required|active enrollment/i.test(message)) {
            this.accessNotice = 'No active enrollment is linked to your student account. Ask an administrator to assign your Academic Group, section, and academic year.';
          } else {
            this.accessNotice = 'Your academics could not be loaded right now.';
            this.messages.add({ severity: 'error', summary: 'Unable to load academics', detail: message });
          }
        }
      });
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
  }
}
