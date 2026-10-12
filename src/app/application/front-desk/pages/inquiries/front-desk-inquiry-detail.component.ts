import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { FOLLOW_UP_TYPES } from '../../../admissions/data/admissions-workspace.config';
import { LeadFullDetail, LeadRecord, LeadStatus } from '../../../admissions/models/admissions-crm.model';
import { AdmissionsCrmService } from '../../../admissions/services/admissions-crm.service';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { AppBackNavComponent } from '../../../../shared/ui/app-list/app-back-nav.component';
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
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, AppBackNavComponent, TcPageSkeletonComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        <app-back-nav fallback="/app/front-desk/inquiries" />
      </tc-saas-page-header>
      @if (loading) {
        <tc-page-skeleton layout="detail" />
      } @else if (lead) {
        <tc-saas-panel title="Inquiry">
          <div class="desk-detail-panel">
            <p>{{ lead.studentName || lead.name }} · {{ lead.parentContactName }} · {{ lead.mobileNumber }}</p>
            <p>{{ lead.classInterestedIn }}</p>
            <p>Source: {{ sourceLabel }}</p>
            @if (detail?.applicationFeeStatus) { <p>Application fee: {{ detail?.applicationFeeStatus }}</p> }
            <label>Status
              <select [(ngModel)]="status" name="status">
                @for (item of statuses; track item) { <option [value]="item">{{ labels[item] }}</option> }
              </select>
            </label>
            <div class="desk-detail-panel__actions">
              <button type="button" class="tc-btn" (click)="saveStatus()">Update status</button>
            </div>
            <label>Counselor
              <select [(ngModel)]="counselorId" name="counselorId">
                <option [ngValue]="null">Unassigned</option>
                @for (c of counselors; track c.staffId) { <option [ngValue]="c.staffId">{{ c.fullName }}</option> }
              </select>
            </label>
            <div class="desk-detail-panel__actions">
              <button type="button" class="tc-btn" (click)="assign()">Assign counselor</button>
            </div>
            <label>Follow-up type
              <select [(ngModel)]="followType" name="followType">
                @for (type of followTypes; track type) { <option [value]="type">{{ type }}</option> }
              </select>
            </label>
            <label>Next follow-up <input type="date" [(ngModel)]="followDate" name="followDate" /></label>
            <label>Note <input [(ngModel)]="followNote" name="followNote" /></label>
            <div class="desk-detail-panel__actions">
              <button type="button" class="tc-btn tc-btn--primary" (click)="saveFollowUp()">Save follow-up</button>
            </div>
          </div>
        </tc-saas-panel>
      }
      <app-toast />
    </section>
  `,
})
export class FrontDeskInquiryDetailComponent implements OnInit {
  private readonly crm = inject(AdmissionsCrmService);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  detail: LeadFullDetail | null = null;
  lead: LeadRecord | null = null;
  status = '';
  counselorId: number | null = null;
  counselors: { staffId: number; fullName: string }[] = [];
  followType = 'CALL';
  followDate = '';
  followNote = '';
  statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'LOST'];
  labels = STATUS_LABEL;
  followTypes = FOLLOW_UP_TYPES;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.crm.searchCounselors('', 0, 50).subscribe({ next: page => { this.counselors = page.content ?? []; this.cdr.markForCheck(); } });
    this.crm.leadFullDetail(id).subscribe({
      next: detail => {
        this.detail = detail;
        this.lead = detail.inquiry;
        this.status = detail.inquiry.status;
        this.counselorId = detail.inquiry.assignedCounselorId ?? null;
        this.followDate = detail.inquiry.nextFollowUpDate || '';
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

  get sourceLabel(): string {
    const source = this.lead?.inquirySource;
    if (source === 'WEBSITE') return 'Website';
    if (source === 'CAMPAIGN') return 'Ad';
    return source || '';
  }

  saveStatus(): void {
    if (!this.lead) return;
    this.crm.updateLeadStatus(this.lead.inquiryId, this.status).subscribe({
      next: row => {
        this.lead = row;
        this.messages.add({ severity: 'success', summary: 'Status updated' });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Status could not be updated' })
    });
  }

  assign(): void {
    if (!this.lead || !this.counselorId) return;
    this.crm.assignCounselor(this.lead.inquiryId, this.counselorId).subscribe({
      next: row => {
        this.lead = row;
        this.messages.add({ severity: 'success', summary: 'Counselor assigned' });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Counselor could not be assigned' })
    });
  }

  saveFollowUp(): void {
    if (!this.lead || !this.followDate) return;
    this.crm.addFollowUp(this.lead.inquiryId, {
      followUpType: this.followType as typeof FOLLOW_UP_TYPES[number],
      nextFollowUpDate: this.followDate,
      remarks: this.followNote || null
    }).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Follow-up saved' }),
      error: () => this.messages.add({ severity: 'error', summary: 'Follow-up could not be saved' })
    });
  }
}
