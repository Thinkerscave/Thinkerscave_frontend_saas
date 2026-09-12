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
  DOCUMENT_TYPES,
  DocumentConfigMode,
  DURATION_DAY_OPTIONS,
  LEAD_STATUS_OPTIONS,
  formatAdmissionsLabel,
  normalizeDocumentType
} from '../../data/admissions-workspace.config';
import { AdmissionsSettings } from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent
} from '../../../../shared/ui/saas';

interface DocumentSettingRow {
  value: string;
  label: string;
  mode: DocumentConfigMode;
}

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
  documentRows: DocumentSettingRow[] = [];
  leadPrefix = 'LD';
  applicationPrefix = 'APP';
  admissionPrefix = 'ADM';
  leadIdleDays = '3';
  missedFollowUpDays = '2';
  assignmentMode = 'MANUAL';
  readonly assignmentOptions = ASSIGNMENT_MODE_OPTIONS;
  readonly durationOptions = DURATION_DAY_OPTIONS;
  readonly modeOptions: { value: DocumentConfigMode; label: string }[] = [
    { value: 'OFF', label: 'Off' },
    { value: 'OPTIONAL', label: 'Optional' },
    { value: 'MANDATORY', label: 'Mandatory' }
  ];

  ngOnInit(): void {
    this.load();
  }

  setDocMode(row: DocumentSettingRow, mode: DocumentConfigMode): void {
    row.mode = mode;
    this.cdr.markForCheck();
  }

  setAssignmentMode(mode: string): void {
    this.assignmentMode = mode;
    this.cdr.markForCheck();
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
          const mandatory = new Set(
            (s.requiredDocuments ?? []).map(normalizeDocumentType).filter(Boolean)
          );
          const optional = new Set(
            (s.optionalDocuments ?? []).map(normalizeDocumentType).filter(Boolean)
          );
          this.documentRows = DOCUMENT_TYPES.filter(t => t !== 'OTHER').map(t => {
            const value = normalizeDocumentType(t);
            let mode: DocumentConfigMode = 'OFF';
            if (mandatory.has(value)) mode = 'MANDATORY';
            else if (optional.has(value)) mode = 'OPTIONAL';
            return { value, label: formatAdmissionsLabel(value), mode };
          });
          this.leadPrefix = s.numbering?.['leadPrefix'] ?? 'LD';
          this.applicationPrefix = s.numbering?.['applicationPrefix'] ?? 'APP';
          this.admissionPrefix = s.numbering?.['admissionPrefix'] ?? 'ADM';
          this.leadIdleDays = s.reminderRules?.['leadIdleDays'] ?? '3';
          this.missedFollowUpDays = s.reminderRules?.['missedFollowUpDays'] ?? '2';
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
      inquirySources: this.settings?.inquirySources ?? [],
      inquiryStatuses: this.settings?.inquiryStatuses?.length
        ? this.settings.inquiryStatuses
        : [...LEAD_STATUS_OPTIONS],
      requiredDocuments: this.documentRows.filter(r => r.mode === 'MANDATORY').map(r => r.value),
      optionalDocuments: this.documentRows.filter(r => r.mode === 'OPTIONAL').map(r => r.value),
      numbering: {
        leadPrefix: this.leadPrefix,
        applicationPrefix: this.applicationPrefix,
        admissionPrefix: this.admissionPrefix
      },
      reminderRules: {
        leadIdleDays: this.leadIdleDays,
        missedFollowUpDays: this.missedFollowUpDays
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
}
