import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { finalize, map } from 'rxjs';

import {
  ResponsibilityAssignment,
  ResponsibilityAssignmentRequest,
  Responsibility,
  STAFF_DOCUMENT_TYPES,
  StaffActivity,
  StaffAddress,
  StaffDetail,
  StaffDocumentResponse
} from '../../shared/models/staff.model';
import { StaffService, saveBlobAsFile } from '../../shared/services/staff.service';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { DocumentPreviewDialogComponent } from '../../../admissions/components/document-preview-dialog/document-preview-dialog.component';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { PermissionService } from '../../../../core/services/permission.service';
import { canWriteStaff } from '../../shared/permissions/staff-permissions';

import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
type ProfileTab = 'overview' | 'responsibilities' | 'documents' | 'activity';

interface TabConfig { id: ProfileTab; label: string; icon: string; }

@Component({
  selector: 'app-staff-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, DialogModule, AvatarComponent, SaasPageHeaderComponent,
    TcPageSkeletonComponent, AppToastComponent, DocumentPreviewDialogComponent, KpiCardComponent, KpiGroupComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../shared/styles/staff.shared.scss', './staff-profile-360.component.scss'],
  templateUrl: './staff-profile-360.component.html'
})
export class StaffProfile360Component implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly api = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly permissions = inject(PermissionService);

  loading = true;
  errorMessage = '';
  actionLoading = false;
  actionsOpen = false;

  staffId = 0;
  profile?: StaffDetail;
  photoUrl: string | null = null;
  photoPreviewOpen = false;
  @ViewChild(DocumentPreviewDialogComponent) private previewDialog?: DocumentPreviewDialogComponent;

  // ── Documents ────────────────────────────────────────────────────────────────
  readonly documentTypes = STAFF_DOCUMENT_TYPES;
  readonly maxUploadBytes = 5 * 1024 * 1024;
  readonly allowedUploadExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  readonly uploadAccept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
  documentBusy = false;
  documentError = '';
  documentFilter: string | null = null;

  uploadDialogOpen = false;
  uploadBusy = false;
  uploadName = '';
  uploadType: string | null = null;
  uploadFile: File | null = null;
  uploadFileError = '';
  uploadNameTouched = false;
  uploadError = '';

  activeTab: ProfileTab = 'overview';

  // ── Activity ─────────────────────────────────────────────────────────────────
  activity: StaffActivity[] = [];
  activityLoading = false;
  activityError = '';

  readonly tabs: TabConfig[] = [
    { id: 'overview',         label: 'Overview',         icon: 'pi-user' },
    { id: 'responsibilities', label: 'Responsibilities', icon: 'pi-sitemap' },
    { id: 'documents',        label: 'Documents',        icon: 'pi-folder-open' },
    { id: 'activity',         label: 'Activity',         icon: 'pi-history' }
  ];

  // ── Assign Responsibility Modal ──────────────────────────────────────────────
  showAssignModal = false;
  allResponsibilities: Responsibility[] = [];
  assignForm: ResponsibilityAssignmentRequest = this.emptyAssignForm();

  get responsibilityOptions(): { label: string; value: number }[] {
    return [
      { label: 'Select Responsibility', value: 0 },
      ...this.allResponsibilities.map(r => ({
        label: `${r.responsibilityName} (${r.responsibilityCode})`,
        value: r.responsibilityId ?? 0
      }))
    ];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const id = Number(p.get('id'));
      if (!id) { this.errorMessage = 'Invalid staff ID.'; this.loading = false; this.cdr.markForCheck(); return; }
      this.staffId = id;
      const tab = this.route.snapshot.queryParamMap.get('tab') as ProfileTab | null;
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab = tab;
      }
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.api.getStaffDetail(this.staffId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: profile => {
          this.profile = profile;
          if (profile.photoUrl) { this.loadPhoto(); } else { this.photoUrl = null; }
          if (this.activeTab === 'activity') { this.loadActivity(); }
          this.pageHeader.setPageHeader({
            subtitle: [profile.staffCode, profile.designation].filter(Boolean).join(' · ')
          });
        },
        error: () => { this.errorMessage = 'Unable to load profile.'; }
      });
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    if (tab === 'activity') { this.loadActivity(); }
  }

  loadActivity(): void {
    if (!this.staffId) { return; }
    this.activityLoading = true;
    this.activityError = '';
    this.api.getActivity(this.staffId)
      .pipe(finalize(() => { this.activityLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: items => { this.activity = items; },
        error: () => { this.activityError = 'Unable to load activity.'; }
      });
  }

  trackByActivityId(_: number, item: StaffActivity): number {
    return item.activityId;
  }

  activityIcon(actionType: string): string {
    switch (actionType) {
      case 'CREATED': return 'pi-plus-circle';
      case 'PROFILE_UPDATED': return 'pi-pencil';
      case 'STATUS_CHANGED': return 'pi-power-off';
      case 'BANK_DETAILS_UPDATED': return 'pi-wallet';
      case 'PHOTO_UPDATED':
      case 'PHOTO_REMOVED': return 'pi-image';
      case 'DOCUMENT_UPLOADED':
      case 'DOCUMENT_REPLACED':
      case 'DOCUMENT_REMOVED': return 'pi-file';
      case 'RESPONSIBILITY_ADDED':
      case 'RESPONSIBILITY_UPDATED':
      case 'RESPONSIBILITY_REMOVED': return 'pi-sitemap';
      default: return 'pi-history';
    }
  }

  get activeResponsibilityCount(): number {
    return (this.profile?.responsibilities ?? []).filter(r => r.active).length;
  }

  readonly emptyMark = '--';

  get age(): number | null {
    return this.yearsSince(this.profile?.dateOfBirth);
  }

  get activeDocumentCount(): number {
    return this.documents.length;
  }

  /** Years in Service KPI: a number, 'Upcoming' for a future joining date, or '—' when missing. */
  get serviceKpiValue(): number | string {
    const joining = this.profile?.joiningDate;
    if (!joining) { return '—'; }
    if (new Date(joining).getTime() > Date.now()) { return 'Upcoming'; }
    return this.yearsSince(joining) ?? '—';
  }

  get serviceYearsText(): string {
    const value = this.serviceKpiValue;
    if (value === '—') { return this.emptyMark; }
    if (value === 'Upcoming') { return 'Not yet joined'; }
    if (value === 0) { return 'Less than 1 year'; }
    return `${value} ${value === 1 ? 'year' : 'years'}`;
  }

  get hasQualificationDetails(): boolean {
    return !!this.profile?.highestQualification || this.profile?.experienceYears != null || this.profile?.staffType === 'TEACHING';
  }

  get documentFilterOptions(): { label: string; value: string | null }[] {
    return [{ label: 'All types', value: null }, ...this.documentTypes];
  }

  get filteredDocuments(): StaffDocumentResponse[] {
    const type = this.documentFilter;
    return type ? this.documents.filter(d => d.documentType === type) : this.documents;
  }

  // ── Quick Actions ────────────────────────────────────────────────────────────

  /** True when the user can edit staff, change status, manage documents and responsibilities. */
  get canWrite(): boolean {
    return canWriteStaff(this.permissions);
  }

  editProfile(): void {
    if (!this.canWrite) return;
    this.actionsOpen = false;
    this.router.navigate(['/app/staff/edit', this.staffId]);
  }

  toggleActionsMenu(): void {
    this.actionsOpen = !this.actionsOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.actionsOpen && !(event.target as HTMLElement).closest('.sp-actions')) {
      this.actionsOpen = false;
      this.cdr.markForCheck();
    }
  }

  toggleActive(): void {
    if (!this.canWrite) return;
    if (!this.profile) { return; }
    if (this.profile.active && !confirm(`Deactivate ${this.profile.fullName}?`)) { return; }
    this.actionsOpen = false;
    this.actionLoading = true;
    const obs = this.profile.active
      ? this.api.deactivateStaff(this.staffId)
      : this.api.activateStaff(this.staffId);
    obs.pipe(finalize(() => { this.actionLoading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: () => { if (this.profile) { this.profile.active = !this.profile.active; } } });
  }

  // ── Assign Responsibility ────────────────────────────────────────────────────

  openAssignModal(): void {
    if (!this.canWrite) return;
    if (this.allResponsibilities.length === 0) {
      this.api.getResponsibilities().subscribe(r => {
        this.allResponsibilities = r;
        this.cdr.markForCheck();
      });
    }
    this.assignForm = this.emptyAssignForm();
    this.showAssignModal = true;
  }

  emptyAssignForm(): ResponsibilityAssignmentRequest {
    return {
      staffId: this.staffId,
      responsibilityId: 0,
      scope: '',
      effectiveFrom: new Date().toISOString().substring(0, 10)
    };
  }

  saveAssignment(): void {
    if (!this.assignForm.responsibilityId) { return; }
    this.assignForm.staffId = this.staffId;
    this.api.assignResponsibility(this.assignForm)
      .subscribe({
        next: () => {
          this.showAssignModal = false;
          this.load();
        }
      });
  }

  removeAssignment(assignment: ResponsibilityAssignment): void {
    if (!this.canWrite) return;
    if (!confirm(`Remove responsibility "${assignment.responsibilityName}"?`)) { return; }
    this.api.removeAssignment(assignment.assignmentId)
      .subscribe({ next: () => { this.load(); } });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  initials(name?: string): string {
    if (!name) { return '?'; }
    return name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  trackByIdx(i: number): number { return i; }

  /** Address split into display lines so long addresses wrap legibly. */
  addressLines(a?: StaffAddress | null): string[] {
    if (!a) { return []; }
    const cityLine = [a.city, a.district].map(v => v?.trim() ?? '').filter(Boolean).join(', ');
    const regionLine = [a.state, a.postalCode].map(v => v?.trim() ?? '').filter(Boolean).join(' - ');
    return [a.addressLine1, a.addressLine2, a.landmark, cityLine, regionLine, a.country]
      .map(v => (v ?? '').trim())
      .filter(v => v.length > 0);
  }

  get documents(): StaffDocumentResponse[] {
    return (this.profile?.documents ?? []).filter(d => d.active);
  }

  documentTypeLabel(code: string): string {
    return STAFF_DOCUMENT_TYPES.find(t => t.value === code)?.label ?? code;
  }

  fileIcon(doc: StaffDocumentResponse): string {
    const ext = (doc.fileExtension || doc.fileName?.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') { return 'pi pi-file-pdf'; }
    if (['jpg', 'jpeg', 'png'].includes(ext)) { return 'pi pi-image'; }
    if (['doc', 'docx'].includes(ext)) { return 'pi pi-file-word'; }
    return 'pi pi-file';
  }

  replaceDocumentFile(event: Event, documentId: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) { return; }
    this.documentBusy = true;
    this.documentError = '';
    this.api.replaceStaffDocument(this.staffId, documentId, file)
      .pipe(finalize(() => { this.documentBusy = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.feedback.success('Document replaced', 'The file was updated.');
          this.refreshDocuments();
        },
        error: err => this.feedback.error('Replace failed', extractApiError(err, 'Unable to replace the document.').message)
      });
  }

  // ── Upload Staff Document dialog ─────────────────────────────────────────────

  openUploadDialog(): void {
    if (!this.canWrite) return;
    this.resetUploadForm();
    this.uploadDialogOpen = true;
  }

  get uploadNameError(): string {
    return this.uploadNameTouched && !this.uploadName.trim() ? 'Document name is required.' : '';
  }

  get canSubmitUpload(): boolean {
    return !this.uploadBusy
      && this.uploadName.trim().length > 0
      && !!this.uploadType
      && !!this.uploadFile
      && !this.uploadFileError;
  }

  onUploadFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) { return; }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!this.allowedUploadExtensions.includes(ext)) {
      this.uploadFileError = 'Choose a PDF, JPG, PNG, DOC or DOCX file.';
      return;
    }
    if (file.size > this.maxUploadBytes) {
      this.uploadFileError = 'File must be 5 MB or smaller.';
      return;
    }
    this.uploadFile = file;
    this.uploadFileError = '';
    this.uploadError = '';
  }

  submitUpload(): void {
    if (!this.canSubmitUpload || !this.uploadFile || !this.uploadType) { return; }
    const name = this.uploadName.trim();
    this.uploadBusy = true;
    this.uploadError = '';
    this.api.uploadStaffDocument(this.staffId, this.uploadFile, this.uploadType, name)
      .pipe(finalize(() => { this.uploadBusy = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.uploadDialogOpen = false;
          this.resetUploadForm();
          this.feedback.success('Document uploaded', `"${name}" was added to this profile.`);
          this.refreshDocuments();
        },
        error: err => { this.uploadError = this.uploadErrorMessage(err); this.cdr.markForCheck(); }
      });
  }

  /** Lists the required fields still missing, or null when the form is complete. */
  get uploadMissing(): string | null {
    const missing: string[] = [];
    if (!this.uploadName.trim()) { missing.push('document name'); }
    if (!this.uploadType) { missing.push('document type'); }
    if (!this.uploadFile) { missing.push('file'); }
    if (missing.length === 0) { return null; }
    return `Still needed: ${missing.join(', ')}.`;
  }

  /** Maps an upload failure to a message the user can act on, shown inside the dialog. */
  private uploadErrorMessage(err: unknown): string {
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    if (status === 0) {
      return 'We could not reach the server. Check your connection and try again. Your details are still filled in.';
    }
    if (status === 403) {
      return 'You do not have permission to add documents to this staff profile.';
    }
    if (status === 404) {
      return 'This staff member could not be found. Refresh the page and try again.';
    }
    if (status >= 500) {
      return 'The server could not save this document, so nothing was added. Your details are still filled in. Try again, or contact support if it keeps failing.';
    }
    return extractApiError(err, 'The document could not be uploaded. Check the name, type and file, then try again.').message;
  }

  /** Cancel and the close icon discard the form only after the user confirms unsaved input. */
  requestCloseUpload(): void {
    if (this.uploadBusy) { return; }
    if (this.uploadDirty && !confirm('Discard this document? The entered details will be lost.')) { return; }
    this.uploadDialogOpen = false;
    this.resetUploadForm();
  }

  onUploadDialogVisibleChange(visible: boolean): void {
    if (visible) { return; }
    if (this.uploadBusy || (this.uploadDirty && !confirm('Discard this document? The entered details will be lost.'))) {
      this.reopenUploadDialog();
      return;
    }
    this.uploadDialogOpen = false;
    this.resetUploadForm();
  }

  private get uploadDirty(): boolean {
    return this.uploadName.trim().length > 0 || !!this.uploadType || !!this.uploadFile;
  }

  /** Re-opens the dialog after a rejected close; the timeout makes Angular see the flag change again. */
  private reopenUploadDialog(): void {
    this.uploadDialogOpen = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.uploadDialogOpen = true;
      this.cdr.markForCheck();
    });
  }

  private resetUploadForm(): void {
    this.uploadError = '';
    this.uploadName = '';
    this.uploadType = null;
    this.uploadFile = null;
    this.uploadFileError = '';
    this.uploadNameTouched = false;
  }

  viewDocument(doc: StaffDocumentResponse): void {
    const source$ = this.api.downloadStaffDocument(this.staffId, doc.documentId).pipe(
      map(({ blob, fileName }) => ({ blob, fileName, contentType: blob.type }))
    );
    this.previewDialog?.openSource(doc.fileName || doc.documentName, source$);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) { return '—'; }
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 * 1024) { return `${Math.round(bytes / 1024)} KB`; }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  downloadDocument(doc: StaffDocumentResponse): void {
    this.api.downloadStaffDocument(this.staffId, doc.documentId).subscribe({
      next: ({ blob, fileName }) => saveBlobAsFile(blob, fileName),
      error: () => { this.documentError = 'Unable to download the document.'; }
    });
  }

  removeDocument(doc: StaffDocumentResponse): void {
    if (!confirm(`Delete "${doc.documentName}"? It will no longer appear on this profile.`)) { return; }
    this.documentBusy = true;
    this.documentError = '';
    this.api.deactivateStaffDocument(this.staffId, doc.documentId)
      .pipe(finalize(() => { this.documentBusy = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.feedback.success('Document deleted', `"${doc.documentName}" was removed.`);
          this.refreshDocuments();
        },
        error: err => this.feedback.error('Delete failed', extractApiError(err, 'Unable to delete the document.').message)
      });
  }

  trackByDocId(_: number, d: StaffDocumentResponse): number { return d.documentId; }

  private loadPhoto(): void {
    this.api.getPhotoObjectUrl(this.staffId).subscribe({
      next: url => { this.photoUrl = url; this.cdr.markForCheck(); },
      error: () => { this.photoUrl = null; }
    });
  }

  private refreshDocuments(): void {
    this.api.listStaffDocuments(this.staffId).subscribe({
      next: docs => {
        if (this.profile) { this.profile.documents = docs; }
        this.cdr.markForCheck();
      }
    });
  }
  trackByAssignId(_: number, a: ResponsibilityAssignment): number { return a.assignmentId; }

  private yearsSince(date?: string): number | null {
    if (!date) { return null; }
    const ms = Date.now() - new Date(date).getTime();
    if (Number.isNaN(ms)) { return null; }
    return Math.max(0, Math.floor(ms / (365.25 * 24 * 3600 * 1000)));
  }
}
