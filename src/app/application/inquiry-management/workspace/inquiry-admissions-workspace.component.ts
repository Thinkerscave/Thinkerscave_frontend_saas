import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject , ChangeDetectionStrategy} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { INQUIRY_NAV_ITEMS, INQUIRY_PIPELINE_STAGES, REQUIRED_ADMISSION_DOCUMENTS } from '../../workspaces/data/workflow-workspace.config';
import { WorkflowDrawerComponent, WorkflowEmptyStateComponent, WorkflowMetricComponent, WorkflowNavComponent } from '../../workspaces/components/workflow-primitives.component';
import { WorkflowDataService } from '../../workspaces/services/workflow-data.service';
import { AdmissionApplication, FollowUpRecord, InquiryRecord, InquiryStatus, InquiryWorkspaceData, PipelineStage, WorkspaceMetric } from '../../workspaces/models/workflow-workspace.model';
import { InitialsPipe } from '../../../shared/pipes';

type DrawerMode = 'inquiry' | 'follow-up' | null;

@Component({
  selector: 'app-inquiry-admissions-workspace',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WorkflowNavComponent, WorkflowMetricComponent, WorkflowEmptyStateComponent, WorkflowDrawerComponent, InitialsPipe],
  templateUrl: './inquiry-admissions-workspace.component.html'
})
export class InquiryAdmissionsWorkspaceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly workflowData = inject(WorkflowDataService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly navItems = INQUIRY_NAV_ITEMS;
  readonly stages = INQUIRY_PIPELINE_STAGES;
  readonly requiredDocuments = REQUIRED_ADMISSION_DOCUMENTS;

  page = 'dashboard';
  data: InquiryWorkspaceData = { inquiries: [], followUps: [], admissions: [] };
  loading = true;
  saving = false;
  message = '';
  drawerMode: DrawerMode = null;
  selectedInquiry?: InquiryRecord;
  draggedInquiry?: InquiryRecord;

  readonly inquiryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email: ['', [Validators.required, Validators.email]],
    classInterested: ['', Validators.required],
    inquirySource: ['WEBSITE', Validators.required],
    referredBy: [''],
    address: ['', [Validators.required, Validators.minLength(5)]],
    comments: ['']
  });

  readonly followUpForm = this.fb.group({
    inquiryId: [null as number | null, Validators.required],
    followUpType: ['CALL', Validators.required],
    statusAfterFollowUp: ['CONTACTED' as InquiryStatus, Validators.required],
    nextFollowUpDate: [''],
    remarks: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit(): void {
    this.page = this.route.snapshot.data['workspacePage'] ?? 'dashboard';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.workflowData.loadInquiryWorkspace()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe(data => {
        this.data = data;
        this.selectedInquiry = data.inquiries[0];
      });
  }

  get title(): string {
    return this.navItems.find(item => item.id === this.page)?.label ?? 'Inquiry & Admissions';
  }

  get subtitle(): string {
    const active = this.navItems.find(item => item.id === this.page);
    return active?.description ?? 'Admissions operations workspace';
  }

  get metrics(): WorkspaceMetric[] {
    const total = this.data.inquiries.length;
    const ready = this.countByStatus('READY_FOR_ADMISSION') + this.countByStatus('DOCUMENTS_PENDING');
    const converted = this.countByStatus('CONVERTED');
    const overdue = this.followUpsByTiming('overdue').length;
    const conversionRate = total ? Math.round((converted / total) * 100) : 0;

    return [
      { label: 'Open Inquiries', value: total, trend: `${this.countByStatus('NEW')} new`, tone: 'info', icon: 'pi pi-users' },
      { label: 'Ready Queue', value: ready, trend: 'Admission-ready families', tone: 'success', icon: 'pi pi-check-circle' },
      { label: 'Overdue Follow-ups', value: overdue, trend: overdue ? 'Needs attention today' : 'No backlog', tone: overdue ? 'danger' : 'success', icon: 'pi pi-clock' },
      { label: 'Conversion', value: `${conversionRate}%`, trend: `${converted} completed`, tone: 'neutral', icon: 'pi pi-chart-line' }
    ];
  }

  get duplicateInquiry(): InquiryRecord | undefined {
    const mobile = this.inquiryForm.controls.mobileNumber.value;
    const email = this.inquiryForm.controls.email.value;
    return this.data.inquiries.find(item => item.mobileNumber === mobile || item.email?.toLowerCase() === email?.toLowerCase());
  }

  inquiriesForStage(stage: PipelineStage): InquiryRecord[] {
    if (stage.id === 'INTERESTED') {
      return this.data.inquiries.filter(item => item.status === 'INTERESTED' || item.status === 'FOLLOW_UP_REQUIRED');
    }
    return this.data.inquiries.filter(item => item.status === stage.id);
  }

  countByStatus(status: InquiryStatus): number {
    return this.data.inquiries.filter(item => item.status === status).length;
  }

  followUpsByTiming(mode: 'today' | 'overdue' | 'upcoming'): FollowUpRecord[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.data.followUps.filter(item => {
      if (!item.nextFollowUpDate) {
        return false;
      }
      if (mode === 'today') {
        return item.nextFollowUpDate === today;
      }
      if (mode === 'overdue') {
        return item.nextFollowUpDate < today;
      }
      return item.nextFollowUpDate > today;
    });
  }

  sourceBreakdown(): Array<{ source: string; total: number; width: number }> {
    const grouped = this.data.inquiries.reduce<Record<string, number>>((acc, inquiry) => {
      const source = inquiry.inquirySource || 'OTHER';
      acc[source] = (acc[source] ?? 0) + 1;
      return acc;
    }, {});
    const max = Math.max(...Object.values(grouped), 1);
    return Object.entries(grouped)
      .map(([source, total]) => ({ source, total, width: Math.max(8, Math.round((total / max) * 100)) }))
      .sort((a, b) => b.total - a.total);
  }

  classDemand(): Array<{ className: string; total: number; width: number }> {
    const grouped = this.data.inquiries.reduce<Record<string, number>>((acc, inquiry) => {
      const className = inquiry.classInterested || 'Unassigned';
      acc[className] = (acc[className] ?? 0) + 1;
      return acc;
    }, {});
    const max = Math.max(...Object.values(grouped), 1);
    return Object.entries(grouped)
      .map(([className, total]) => ({ className, total, width: Math.max(8, Math.round((total / max) * 100)) }))
      .sort((a, b) => b.total - a.total);
  }

  applicationDocumentProgress(application: AdmissionApplication): number {
    const uploaded = application.uploadedDocuments?.length ?? 0;
    return Math.min(100, Math.round((uploaded / this.requiredDocuments.length) * 100));
  }

  openDrawer(mode: DrawerMode, inquiry?: InquiryRecord): void {
    this.drawerMode = mode;
    this.selectedInquiry = inquiry ?? this.selectedInquiry ?? this.data.inquiries[0];

    if (mode === 'follow-up' && this.selectedInquiry) {
      this.followUpForm.patchValue({ inquiryId: this.selectedInquiry.inquiryId });
    }
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.message = '';
  }

  submitInquiry(): void {
    if (this.inquiryForm.invalid || this.duplicateInquiry) {
      this.inquiryForm.markAllAsTouched();
      this.message = this.duplicateInquiry ? 'Duplicate inquiry detected from mobile or email.' : 'Complete the required inquiry details.';
      return;
    }

    this.saving = true;
    this.workflowData.createInquiry(this.inquiryForm.getRawValue() as Partial<InquiryRecord>)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          this.inquiryForm.reset({ inquirySource: 'WEBSITE' });
          this.message = 'Inquiry captured and added to the pipeline.';
          this.load();
        },
        error: () => this.message = 'Inquiry could not be saved. Please verify the fields and try again.'
      });
  }

  submitFollowUp(): void {
    if (this.followUpForm.invalid) {
      this.followUpForm.markAllAsTouched();
      this.message = 'Follow-up remarks and inquiry are required.';
      return;
    }

    const payload = this.followUpForm.getRawValue();
    this.saving = true;
    this.workflowData.addFollowUp(Number(payload.inquiryId), {
      followUpType: payload.followUpType as FollowUpRecord['followUpType'],
      statusAfterFollowUp: payload.statusAfterFollowUp as InquiryStatus,
      nextFollowUpDate: payload.nextFollowUpDate || undefined,
      remarks: payload.remarks ?? ''
    }).pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          this.message = 'Follow-up saved and inquiry timeline updated.';
          this.load();
        },
        error: () => this.message = 'Follow-up could not be saved for this inquiry.'
      });
  }

  onDragStart(inquiry: InquiryRecord): void {
    this.draggedInquiry = inquiry;
  }

  onDrop(stage: PipelineStage): void {
    if (!this.draggedInquiry || this.draggedInquiry.status === stage.id) {
      this.draggedInquiry = undefined;
      return;
    }

    const moving = this.draggedInquiry;
    this.draggedInquiry = undefined;
    this.workflowData.moveInquiryStage(moving, stage.id).subscribe({
      next: () => {
        this.message = `${moving.name} moved to ${stage.label}.`;
        this.load();
      },
      error: () => this.message = 'Stage change could not be saved.'
    });
  }

  inquiryName(id: number): string {
    return this.data.inquiries.find(item => item.inquiryId === id)?.name ?? `Inquiry #${id}`;
  }

  inquiryById(id: number): InquiryRecord | undefined {
    return this.data.inquiries.find(item => item.inquiryId === id);
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
  }
}