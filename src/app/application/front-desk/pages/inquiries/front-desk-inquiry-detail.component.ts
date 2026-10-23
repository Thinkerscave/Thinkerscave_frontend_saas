import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { FOLLOW_UP_TYPES } from '../../../admissions/data/admissions-workspace.config';
import { FollowUpRecord, LeadFullDetail, LeadRecord, LeadStatus } from '../../../admissions/models/admissions-crm.model';
import { AdmissionsCrmService } from '../../../admissions/services/admissions-crm.service';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import {
  AppEmptyStateComponent,
  AppFormSectionComponent,
  AppInputComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption
} from '../../../../shared/ui/app-form';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading/tc-page-skeleton.component';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Open',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  APPLICATION_STARTED: 'Application started',
  APPLICATION_SUBMITTED: 'Converted',
  LOST: 'Dropped'
};

@Component({
  selector: 'app-front-desk-inquiry-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    TcPageSkeletonComponent,
    AppFormSectionComponent,
    AppSectionHeaderComponent,
    AppSelectComponent,
    AppInputComponent,
    AppEmptyStateComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './front-desk-inquiry-detail.component.html',
  styleUrls: ['../../front-desk.shared.scss', './front-desk-inquiry-detail.component.scss']
})
export class FrontDeskInquiryDetailComponent implements OnInit, OnDestroy {
  private readonly crm = inject(AdmissionsCrmService);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  detail: LeadFullDetail | null = null;
  lead: LeadRecord | null = null;
  followUps: FollowUpRecord[] = [];
  status = '';
  counselorId: string | null = null;
  counselors: { staffId: number; fullName: string }[] = [];
  followType = 'CALL';
  followDate = '';
  followNote = '';
  statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'LOST'];
  labels = STATUS_LABEL;
  followTypes = FOLLOW_UP_TYPES;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.crm.searchCounselors('', 0, 50).subscribe({
      next: page => {
        this.counselors = page.content ?? [];
        this.cdr.markForCheck();
      }
    });
    this.loadDetail(id);
  }

  ngOnDestroy(): void {
    this.pageHeader.setPageHeader(null);
  }

  get initials(): string {
    const name = (this.lead?.studentName || this.lead?.name || '?').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  get statusOptions(): AppSelectOption[] {
    return this.statuses.map(s => ({ value: s, label: STATUS_LABEL[s] || s }));
  }

  get counselorOptions(): AppSelectOption[] {
    return [
      { value: '', label: 'Unassigned' },
      ...this.counselors.map(c => ({ value: String(c.staffId), label: c.fullName }))
    ];
  }

  get followTypeOptions(): AppSelectOption[] {
    return this.followTypes.map(t => ({ value: t, label: this.formatFollowType(t) }));
  }

  get sourceLabel(): string {
    const source = this.lead?.inquirySource;
    if (source === 'WEBSITE') return 'Website';
    if (source === 'CAMPAIGN') return 'Ad';
    if (source === 'WALK_IN') return 'Walk-in';
    return source || '—';
  }

  formatFollowType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  private loadDetail(id: number): void {
    this.loading = true;
    this.crm.leadFullDetail(id).subscribe({
      next: detail => {
        this.applyDetail(detail);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Inquiry could not be loaded' });
        this.cdr.markForCheck();
      }
    });
  }

  private applyDetail(detail: LeadFullDetail): void {
    this.detail = detail;
    this.lead = detail.inquiry;
    this.followUps = detail.followUps ?? [];
    this.status = detail.inquiry.status;
    this.counselorId =
      detail.inquiry.assignedCounselorId != null ? String(detail.inquiry.assignedCounselorId) : '';
    this.followDate = detail.inquiry.nextFollowUpDate || '';

    const student = detail.inquiry.studentName || detail.inquiry.name || 'Inquiry';
    const ref = detail.inquiry.inquiryNumber || `INQ-${detail.inquiry.inquiryId}`;
    this.pageHeader.setPageHeader({
      subtitle: `${ref} · ${student} · ${STATUS_LABEL[detail.inquiry.status] || detail.inquiry.status}`
    });
  }

  saveStatus(): void {
    if (!this.lead) {
      return;
    }
    this.crm.updateLeadStatus(this.lead.inquiryId, this.status).subscribe({
      next: row => {
        this.lead = row;
        this.applyDetail({ ...this.detail!, inquiry: row });
        this.messages.add({ severity: 'success', summary: 'Status updated' });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Status could not be updated' })
    });
  }

  assign(): void {
    const staffId = this.counselorId?.trim() ? Number(this.counselorId) : null;
    if (!this.lead || !staffId) {
      this.messages.add({ severity: 'warn', summary: 'Select a counselor to assign' });
      return;
    }
    this.crm.assignCounselor(this.lead.inquiryId, staffId).subscribe({
      next: row => {
        this.lead = row;
        this.applyDetail({ ...this.detail!, inquiry: row });
        this.messages.add({ severity: 'success', summary: 'Counselor assigned' });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Counselor could not be assigned' })
    });
  }

  saveFollowUp(): void {
    if (!this.lead || !this.followDate) {
      this.messages.add({ severity: 'warn', summary: 'Pick a next follow-up date' });
      return;
    }
    this.crm.addFollowUp(this.lead.inquiryId, {
      followUpType: this.followType as typeof FOLLOW_UP_TYPES[number],
      nextFollowUpDate: this.followDate,
      remarks: this.followNote || null
    }).subscribe({
      next: () => {
        this.followNote = '';
        this.messages.add({ severity: 'success', summary: 'Follow-up saved' });
        this.loadDetail(this.lead!.inquiryId);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Follow-up could not be saved' })
    });
  }
}
