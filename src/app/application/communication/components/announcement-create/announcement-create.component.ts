import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap, of } from 'rxjs';

import { CommunicationService } from '../../services/communication.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStepperComponent,
  SaasStep
} from '../../../../shared/ui/saas';

type Priority = 'High' | 'Medium' | 'Low';

interface DraftAnnouncement {
  title: string;
  body: string;
  priority: Priority;
  audienceAll: boolean;
  audienceParents: boolean;
  audienceStudents: boolean;
  audienceStaff: boolean;
  audienceGrade: string;
  attachments: string[];
  scheduleNow: boolean;
  sendDate: string;
  sendTime: string;
  channels: { email: boolean; sms: boolean; push: boolean; inApp: boolean };
}

@Component({
  selector: 'app-announcement-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, SaasStepperComponent],
  templateUrl: './announcement-create.component.html',
  styleUrl: './announcement-create.component.scss'
})
export class AnnouncementCreateComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(CommunicationService);
  private readonly router = inject(Router);

  steps: SaasStep[] = [
    { key: 'basic', label: 'Basic Information' },
    { key: 'audience', label: 'Audience' },
    { key: 'attachments', label: 'Attachments' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'review', label: 'Review & Send' }
  ];
  active = 0;
  saving = false;

  draft: DraftAnnouncement = {
    title: '',
    body: '',
    priority: 'Medium',
    audienceAll: true,
    audienceParents: false,
    audienceStudents: false,
    audienceStaff: false,
    audienceGrade: '',
    attachments: [],
    scheduleNow: true,
    sendDate: new Date().toISOString().slice(0, 10),
    sendTime: '09:00',
    channels: { email: true, sms: false, push: true, inApp: true }
  };

  next(): void { if (this.active < this.steps.length - 1) this.active += 1; }
  prev(): void { if (this.active > 0) this.active -= 1; }

  addAttachment(name: string): void {
    if (name && name.trim()) {
      this.draft.attachments = [...this.draft.attachments, name.trim()];
    }
  }
  removeAttachment(idx: number): void {
    this.draft.attachments = this.draft.attachments.filter((_, i) => i !== idx);
  }

  get audienceLabel(): string {
    const out: string[] = [];
    if (this.draft.audienceAll) out.push('Everyone');
    if (this.draft.audienceParents) out.push('Parents');
    if (this.draft.audienceStudents) out.push('Students');
    if (this.draft.audienceStaff) out.push('Staff');
    if (this.draft.audienceGrade) out.push(`Grade ${this.draft.audienceGrade}`);
    return out.length ? out.join(', ') : 'Not selected';
  }

  submit(): void {
    this.saving = true;
    const audiences = this.buildAudiences();
    this.api.saveNotice({
      title: this.draft.title,
      body: this.draft.body,
      audience: this.audienceLabel,
      status: 'DRAFT',
      audiences
    } as any)
      .pipe(
        switchMap(notice => this.draft.scheduleNow ? this.api.publishNotice(notice.id) : of(notice)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.saving = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: () => this.router.navigate(['/app/communication/announcements']),
        error: () => { /* toast handled globally */ }
      });
  }

  private buildAudiences(): Array<{ audienceType: string; refId?: number | null }> {
    const out: Array<{ audienceType: string; refId?: number | null }> = [];
    if (this.draft.audienceAll) {
      out.push({ audienceType: 'ALL' });
      return out;
    }
    if (this.draft.audienceParents) out.push({ audienceType: 'PARENTS' });
    if (this.draft.audienceStudents) out.push({ audienceType: 'STUDENTS' });
    if (this.draft.audienceStaff) out.push({ audienceType: 'STAFF' });
    return out;
  }

  cancel(): void {
    this.router.navigate(['/app/communication/announcements']);
  }
}
