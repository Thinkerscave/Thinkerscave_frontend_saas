import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize, forkJoin } from 'rxjs';

import {
  ApplicationDocument,
  ApplicationRecord,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';
import {
  buildApplicationReviewSections,
  ReviewSection
} from '../../data/application-review.util';
import { formatAdmissionsLabel } from '../../data/admissions-workspace.config';
import {
  SaasPageHeaderComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../core/services/permission.service';
import { DocumentPreviewDialogComponent } from '../../components/document-preview-dialog/document-preview-dialog.component';

const APPLICATIONS_RESOURCE = 'ADMISSIONS_APPLICATIONS';

@Component({
  selector: 'app-application-review',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    DocumentPreviewDialogComponent,
    HasPermissionDirective,
    SaasPageHeaderComponent,
    SaasPillComponent
  ],
  providers: [ConfirmationService, MessageService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './application-review.component.html'
})
export class ApplicationReviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdmissionsCrmService);
  private readonly nav = inject(AdmissionsNavService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly permissions = inject(PermissionService);

  @ViewChild(DocumentPreviewDialogComponent) private previewDialog?: DocumentPreviewDialogComponent;

  readonly applicationsResource = APPLICATIONS_RESOURCE;
  loading = true;
  errorMessage = '';
  app: ApplicationRecord | null = null;
  documents: ApplicationDocument[] = [];

  rejectDialogOpen = false;
  rejectRemarks = '';
  correctionDialogOpen = false;
  correctionReason = '';
  enrollVisible = false;
  enrolling = false;
  enrollmentForm = { academicYearId: null as number | null, classId: null as number | null, sectionId: null as number | null };
  years: LookupOption[] = [];
  classes: LookupOption[] = [];
  sections: LookupOption[] = [];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.loading = false;
      this.errorMessage = 'Invalid application.';
      return;
    }
    this.load(id);
    this.api.academicYears().subscribe({
      next: years => {
        this.years = years;
        this.cdr.markForCheck();
      }
    });
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(APPLICATIONS_RESOURCE);
  }

  get canManage(): boolean {
    return this.permissions.canManage(APPLICATIONS_RESOURCE);
  }

  /** Edit form only while backend EDITABLE statuses — never after APPROVED. */
  get canEditForm(): boolean {
    if (!this.app || !this.canManage) return false;
    return ['DRAFT', 'ACTION_REQUIRED', 'DOCUMENTS_PENDING'].includes(this.app.status);
  }

  get canDecide(): boolean {
    if (!this.app || !this.canApprove) return false;
    return ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'FEE_PENDING'].includes(this.app.status);
  }

  get canEnroll(): boolean {
    return !!this.app && this.app.status === 'APPROVED' && this.canApprove;
  }

  get pendingDocs(): number {
    return this.documents.filter(d => d.status !== 'VERIFIED' && d.status !== 'REJECTED').length;
  }

  get verifiedDocs(): number {
    return this.documents.filter(d => d.status === 'VERIFIED').length;
  }

  load(id: number): void {
    this.loading = true;
    forkJoin({
      app: this.api.getApplication(id),
      docs: this.api.listDocuments(id)
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: ({ app, docs }) => {
          this.app = app;
          this.documents = docs;
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Unable to load application.';
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: this.errorMessage });
        }
      });
  }

  back(): void {
    this.nav.back(this.route, '/app/admissions/applications');
  }

  editForm(): void {
    if (!this.app) return;
    this.nav.toApplication(this.app.applicationId, 'applications');
  }

  get reviewSections(): ReviewSection[] {
    return this.app ? buildApplicationReviewSections(this.app) : [];
  }

  docLabel(type: string): string {
    return formatAdmissionsLabel(type);
  }

  docTone(status: string | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
    const s = (status || '').toUpperCase();
    if (s === 'VERIFIED') return 'success';
    if (s === 'REJECTED') return 'danger';
    if (s === 'PENDING') return 'warning';
    return 'neutral';
  }

  previewDocument(doc: ApplicationDocument): void {
    this.previewDialog?.open(doc);
  }

  verifyDoc(doc: ApplicationDocument, status: 'VERIFIED' | 'REJECTED'): void {
    let remarks: string | undefined;
    if (status === 'REJECTED') {
      remarks = window.prompt('Reason for rejection') || '';
      if (!remarks.trim()) {
        this.messages.add({ severity: 'warn', summary: 'Reason required', detail: 'Enter a rejection reason.' });
        return;
      }
    }
    this.api.verifyDocument(doc.documentId, status, remarks).subscribe({
      next: updated => {
        this.documents = this.documents.map(d =>
          d.documentId === updated.documentId ? { ...d, ...updated } : d
        );
        this.messages.add({
          severity: 'success',
          summary: status === 'VERIFIED' ? 'Verified' : 'Rejected',
          detail: status === 'VERIFIED' ? 'Document verified.' : 'Document rejected.'
        });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Update failed',
        detail: 'Could not update document status.'
      })
    });
  }

  approve(): void {
    if (!this.app) return;
    if (this.pendingDocs > 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'Documents pending',
        detail: 'Verify or reject remaining documents before approving.'
      });
      return;
    }
    this.confirmation.confirm({
      message: `Approve application for ${this.app.applicantName}? This reserves the seat. Enroll separately to create the student.`,
      header: 'Confirm Approval',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.api.approveApplication(this.app!.applicationId).subscribe({
          next: updated => {
            this.app = updated;
            this.messages.add({
              severity: 'success',
              summary: 'Approved',
              detail: 'Application approved. Use Enroll to create the student record.'
            });
            this.cdr.markForCheck();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Approval failed',
            detail: err?.error?.message || 'Could not approve. Ensure required documents are verified.'
          })
        });
      }
    });
  }

  openReject(): void {
    this.rejectRemarks = '';
    this.rejectDialogOpen = true;
  }

  confirmReject(): void {
    if (!this.app) return;
    const remarks = this.rejectRemarks.trim();
    if (!remarks) {
      this.messages.add({ severity: 'warn', summary: 'Reason required', detail: 'Enter a rejection reason.' });
      return;
    }
    this.api.rejectApplication(this.app.applicationId, remarks).subscribe({
      next: updated => {
        this.app = updated;
        this.rejectDialogOpen = false;
        this.messages.add({ severity: 'warn', summary: 'Rejected', detail: 'Application rejected.' });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Rejection failed', detail: 'Could not reject.' })
    });
  }

  openCorrection(): void {
    this.correctionReason = '';
    this.correctionDialogOpen = true;
  }

  confirmCorrection(): void {
    if (!this.app) return;
    const reason = this.correctionReason.trim();
    if (!reason) {
      this.messages.add({ severity: 'warn', summary: 'Reason required', detail: 'Describe what needs correction.' });
      return;
    }
    this.api.requestCorrection(this.app.applicationId, reason).subscribe({
      next: updated => {
        this.app = updated;
        this.correctionDialogOpen = false;
        this.messages.add({ severity: 'success', summary: 'Sent for correction', detail: 'Counselor can update and resubmit.' });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Request failed', detail: 'Could not send for correction.' })
    });
  }

  openEnroll(): void {
    if (!this.app) return;
    this.enrollmentForm = {
      academicYearId: this.app.academicYearId ?? null,
      classId: this.app.classId ?? null,
      sectionId: this.app.sectionId ?? null
    };
    this.enrollVisible = true;
    if (this.enrollmentForm.academicYearId) {
      this.onYearChange(this.enrollmentForm.academicYearId, this.enrollmentForm.classId);
    }
  }

  onYearChange(yearId: number | null, keepClassId: number | null = null): void {
    this.classes = [];
    this.sections = [];
    this.enrollmentForm.classId = keepClassId;
    this.enrollmentForm.sectionId = null;
    if (!yearId) return;
    this.api.academicClasses(yearId).subscribe({
      next: classes => {
        this.classes = classes;
        if (keepClassId) this.onClassChange(keepClassId);
        this.cdr.markForCheck();
      }
    });
  }

  onClassChange(classId: number | null): void {
    this.sections = [];
    this.enrollmentForm.sectionId = null;
    if (!classId) return;
    this.api.academicSections(classId).subscribe({
      next: sections => {
        this.sections = sections;
        this.cdr.markForCheck();
      }
    });
  }

  enroll(): void {
    if (!this.app || !this.enrollmentForm.academicYearId || !this.enrollmentForm.classId) return;
    this.enrolling = true;
    this.api.enrollApplication(this.app.applicationId, {
      academicYearId: this.enrollmentForm.academicYearId,
      classId: this.enrollmentForm.classId,
      sectionId: this.enrollmentForm.sectionId
    }).pipe(finalize(() => {
      this.enrolling = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: result => {
        this.enrollVisible = false;
        this.app = {
          ...this.app!,
          status: 'ENROLLED',
          studentId: result.studentId,
          studentCode: result.studentCode,
          admissionNumber: result.admissionNumber,
          academicYearId: result.academicYearId ?? this.app!.academicYearId,
          classId: result.classId ?? this.app!.classId,
          sectionId: result.sectionId ?? this.app!.sectionId
        };
        this.messages.add({
          severity: 'success',
          summary: 'Enrolled',
          detail: `${result.studentName || this.app?.applicantName} is now in Students.`
        });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Enrollment failed', detail: 'Could not create the student.' })
    });
  }

  statusLabel(status: string): string {
    return (status || '').replace(/_/g, ' ');
  }

  statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    switch (status) {
      case 'APPROVED':
      case 'ENROLLED':
        return 'success';
      case 'REJECTED':
      case 'CANCELLED':
        return 'danger';
      case 'ACTION_REQUIRED':
      case 'DOCUMENTS_PENDING':
        return 'warning';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'info';
      default:
        return 'neutral';
    }
  }
}
