import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import {
  ASSIGNMENT_MODE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  REMINDER_LEAD_OPTIONS,
  REMINDER_MODE_OPTIONS,
  formatAdmissionsLabel
} from '../../data/admissions-workspace.config';
import { AdmissionsSettings } from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-admissions-crm-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, CommonModule, FormsModule, DropdownModule, SaasPageHeaderComponent, SaasPanelComponent],
  providers: [MessageService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './admissions-settings.component.html'
})
export class AdmissionsSettingsComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  loading = false;
  saving = false;
  errorMessage = '';
  settings: AdmissionsSettings | null = null;
  sourcesText = '';
  documentsText = '';
  leadPrefix = 'LD';
  applicationPrefix = 'APP';
  admissionPrefix = 'ADM';
  reminderMode = 'AUTO';
  reminderLeadTime = '24H';
  assignmentMode = 'MANUAL';
  readonly assignmentOptions = ASSIGNMENT_MODE_OPTIONS;
  readonly reminderModeOptions = REMINDER_MODE_OPTIONS;
  readonly reminderLeadOptions = REMINDER_LEAD_OPTIONS;
  readonly pipelineStatuses = LEAD_STATUS_OPTIONS.map(s => formatAdmissionsLabel(s));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.settings()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: s => {
          this.settings = s;
          this.sourcesText = (s.inquirySources ?? []).join('\n');
          this.documentsText = (s.requiredDocuments ?? []).join('\n');
          this.leadPrefix = s.numbering?.['leadPrefix'] ?? 'LD';
          this.applicationPrefix = s.numbering?.['applicationPrefix'] ?? 'APP';
          this.admissionPrefix = s.numbering?.['admissionPrefix'] ?? 'ADM';
          this.reminderMode = s.reminderRules?.['defaultMode'] ?? 'AUTO';
          this.reminderLeadTime = s.reminderRules?.['defaultLeadTime'] ?? '24H';
          this.assignmentMode = s.assignmentMode ?? 'MANUAL';
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Unable to load admissions settings.';
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: this.errorMessage });
        }
      });
  }

  save(): void {
    this.saving = true;
    const payload: AdmissionsSettings = {
      inquirySources: this.splitLines(this.sourcesText),
      inquiryStatuses: [...LEAD_STATUS_OPTIONS],
      requiredDocuments: this.splitLines(this.documentsText),
      numbering: {
        leadPrefix: this.leadPrefix,
        applicationPrefix: this.applicationPrefix,
        admissionPrefix: this.admissionPrefix
      },
      reminderRules: {
        defaultMode: this.reminderMode,
        defaultLeadTime: this.reminderLeadTime
      },
      assignmentMode: this.assignmentMode
    };
    this.api.saveSettings(payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: saved => {
          this.settings = saved;
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Admissions settings updated.' });
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save settings.' })
      });
  }

  private splitLines(value: string): string[] {
    return value.split(/\r?\n|,/).map(item => item.trim()).filter(Boolean);
  }
}
