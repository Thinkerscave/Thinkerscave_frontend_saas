import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { finalize, forkJoin, map } from 'rxjs';

import {
  AcademicHistoryRow,
  StudentDocumentEntry,
  StudentProfile360,
  StudentTimelineEntry,
  ParentInfo,
  GuardianInfo,
  ClassOption,
  SectionOption
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { DocumentPreviewDialogComponent } from '../../../admissions/components/document-preview-dialog/document-preview-dialog.component';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';

import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi';
type ProfileTab = 'OVERVIEW' | 'DOCUMENTS' | 'TIMELINE';
type TimelineFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

@Component({
  selector: 'app-student-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, DialogModule, AvatarComponent, SaasPageHeaderComponent,
    TcPageSkeletonComponent, DocumentPreviewDialogComponent, AppToastComponent, KpiCardComponent, KpiGroupComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './student-profile-360.component.html'
})
export class StudentProfile360Component implements OnInit, OnDestroy {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  @ViewChild(DocumentPreviewDialogComponent) private previewDialog?: DocumentPreviewDialogComponent;

  studentId!: number;
  loading = true;
  errorMessage = '';
  avatarUrl: string | null = null;
  private avatarObjectUrl: string | null = null;

  profile?: StudentProfile360;
  timeline: StudentTimelineEntry[] = [];
  academicHistory: AcademicHistoryRow[] = [];
  studentDocs: StudentDocumentEntry[] = [];

  activeTab: ProfileTab = 'OVERVIEW';
  readonly tabs: { key: ProfileTab; label: string; icon: string }[] = [
    { key: 'OVERVIEW',   label: 'Overview',   icon: 'pi pi-th-large' },
    { key: 'DOCUMENTS',  label: 'Documents',  icon: 'pi pi-file' },
    { key: 'TIMELINE',   label: 'Timeline',   icon: 'pi pi-history' }
  ];

  moreActionsOpen = false;
  guardianForm: ParentInfo = this.emptyGuardian();
  guardianEditorOpen = false;
  guardianSaving = false;
  editingGuardianId: number | null = null;
  editingEnrollment = false;
  enrollmentSaving = false;
  academicYearOptions: ClassOption[] = [];
  enrollmentClassOptions: ClassOption[] = [];
  enrollmentSectionOptions: SectionOption[] = [];
  enrollmentForm: { academicYearId: number | null; classId: number | null; sectionId: number | null; rollNumber: string } = {
    academicYearId: null,
    classId: null,
    sectionId: null,
    rollNumber: ''
  };
  documentUploadOpen = false;
  documentUploadBusy = false;
  documentBusy = false;
  documentError = '';
  documentName = '';
  documentNameTouched = false;
  documentType: string | null = null;
  documentFile: File | null = null;
  documentFileError = '';
  documentFilter: string | null = null;
  readonly maxDocumentBytes = 5 * 1024 * 1024;
  readonly allowedDocumentExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'xlsx', 'xls', 'csv'];
  readonly documentTypes = [
    { label: 'Birth Certificate', value: 'BIRTH_CERTIFICATE' },
    { label: 'Identity Proof', value: 'AADHAR' },
    { label: 'Previous School Certificate', value: 'PREVIOUS_SCHOOL_CERTIFICATE' },
    { label: 'Transfer Certificate', value: 'TRANSFER_CERTIFICATE' },
    { label: 'Marksheet', value: 'MARKSHEET' },
    { label: 'Photograph', value: 'PHOTO' },
    { label: 'Other', value: 'OTHER' }
  ];
  readonly documentAccept = '.pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv';

  readonly relationshipOptions: { label: string; value: string }[] = [
    { label: 'Father', value: 'FATHER' },
    { label: 'Mother', value: 'MOTHER' },
    { label: 'Guardian', value: 'GUARDIAN' },
    { label: 'Other', value: 'OTHER' }
  ];

  readonly bloodGroupOptions: { label: string; value: string }[] = [
    { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' }
  ];

  timelineFilter: TimelineFilter = 'ALL';

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.studentId) {
      this.router.navigate(['/app/students/directory']);
      return;
    }
    const qTab = this.route.snapshot.queryParamMap.get('tab') as ProfileTab;
    if (qTab && this.tabs.some(t => t.key === qTab)) {
      this.activeTab = qTab;
    }
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.revokeAvatarUrl();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      profile:  this.api.profile(this.studentId),
      timeline: this.api.timeline(this.studentId),
      history:  this.api.academicHistory(this.studentId),
      docs:     this.api.studentDocuments(this.studentId)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ profile, timeline, history, docs }) => {
          this.profile = profile;
          this.timeline = timeline;
          this.academicHistory = history;
          this.studentDocs = docs;
          this.loadStudentPhoto(profile, docs);
        },
        error: () => { this.errorMessage = 'Unable to load student profile. Please retry.'; }
      });
  }

  private loadStudentPhoto(profile: StudentProfile360, docs: StudentDocumentEntry[]): void {
    const photoDocId =
      profile.overview.photoDocumentId
      ?? docs.find(d => d.documentType?.toUpperCase() === 'PHOTO')?.documentId
      ?? null;
    if (!photoDocId) {
      this.revokeAvatarUrl();
      this.avatarUrl = null;
      this.cdr.markForCheck();
      return;
    }
    this.api.downloadDocument(photoDocId).subscribe({
      next: (blob) => {
        this.revokeAvatarUrl();
        this.avatarObjectUrl = URL.createObjectURL(blob);
        this.avatarUrl = this.avatarObjectUrl;
        this.cdr.markForCheck();
      },
      error: () => {
        this.avatarUrl = null;
        this.cdr.markForCheck();
      }
    });
  }

  private revokeAvatarUrl(): void {
    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
      this.avatarObjectUrl = null;
    }
  }

  go(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  editStudent(): void {
    void this.router.navigate(['/app/students/edit', this.studentId]);
  }

  toggleMoreActions(event: Event): void {
    event.stopPropagation();
    this.moreActionsOpen = !this.moreActionsOpen;
  }

  closeMenus(): void { this.moreActionsOpen = false; }

  startEditEnrollment(): void {
    if (!this.profile) return;
    const academics = this.profile.academics;
    this.enrollmentForm = {
      academicYearId: academics.academicYearId ?? null,
      classId: academics.classId ?? null,
      sectionId: academics.sectionId ?? null,
      rollNumber: academics.rollNumber ?? ''
    };
    this.editingEnrollment = true;
    this.api.listAcademicYears().subscribe({
      next: years => {
        this.academicYearOptions = years;
        if (!this.enrollmentForm.academicYearId) return this.cdr.markForCheck();
        this.api.listClasses(this.enrollmentForm.academicYearId).subscribe({
          next: classes => {
            this.enrollmentClassOptions = classes;
            if (!this.enrollmentForm.classId) return this.cdr.markForCheck();
            this.api.listSectionsByClass(this.enrollmentForm.classId).subscribe({
              next: sections => { this.enrollmentSectionOptions = sections; this.cdr.markForCheck(); },
              error: () => { this.errorMessage = 'Unable to load sections.'; this.cdr.markForCheck(); }
            });
            this.cdr.markForCheck();
          },
          error: () => { this.errorMessage = 'Unable to load classes.'; this.cdr.markForCheck(); }
        });
        this.cdr.markForCheck();
      },
      error: () => { this.errorMessage = 'Unable to load academic years.'; this.cdr.markForCheck(); }
    });
  }

  onEnrollmentYearChange(value: number | string | null): void {
    const academicYearId = value == null ? null : Number(value);
    this.enrollmentForm.academicYearId = Number.isFinite(academicYearId) ? academicYearId : null;
    this.enrollmentForm.classId = null;
    this.enrollmentForm.sectionId = null;
    this.enrollmentClassOptions = [];
    this.enrollmentSectionOptions = [];
    if (this.enrollmentForm.academicYearId) {
      this.api.listClasses(this.enrollmentForm.academicYearId).subscribe({
        next: classes => { this.enrollmentClassOptions = classes; this.cdr.markForCheck(); },
        error: () => { this.errorMessage = 'Unable to load classes.'; this.cdr.markForCheck(); }
      });
    }
  }

  onEnrollmentClassChange(value: number | string | null): void {
    const classId = value == null ? null : Number(value);
    this.enrollmentForm.classId = Number.isFinite(classId) ? classId : null;
    this.enrollmentForm.sectionId = null;
    this.enrollmentSectionOptions = [];
    if (this.enrollmentForm.classId) {
      this.api.listSectionsByClass(this.enrollmentForm.classId).subscribe({
        next: sections => { this.enrollmentSectionOptions = sections; this.cdr.markForCheck(); },
        error: () => { this.errorMessage = 'Unable to load sections.'; this.cdr.markForCheck(); }
      });
    }
  }

  saveEnrollment(): void {
    const { academicYearId, classId, sectionId, rollNumber } = this.enrollmentForm;
    if (!academicYearId || !classId) {
      this.errorMessage = 'Academic year and class are required.';
      return;
    }
    const current = this.profile?.academics;
    const placementChanged = current?.classId !== classId || (current?.sectionId ?? null) !== sectionId;
    if (placementChanged && !confirm('This placement change will retain the previous enrollment in academic history. Continue?')) return;
    this.enrollmentSaving = true;
    this.api.updateEnrollment(this.studentId, { academicYearId, classId, sectionId, rollNumber })
      .pipe(finalize(() => { this.enrollmentSaving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.editingEnrollment = false;
          this.errorMessage = '';
          this.messages.add({ severity: 'success', summary: 'Enrollment updated', detail: 'Student placement was saved.' });
          this.loadAll();
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Unable to save enrollment.';
          this.cdr.markForCheck();
        }
      });
  }

  emptyGuardian(): ParentInfo {
    return {
      relationship: 'GUARDIAN',
      firstName: '',
      lastName: '',
      mobile: '',
      isPrimaryContact: false,
      receiveSms: true,
      receiveEmail: true,
      isPickupAuthorized: false
    };
  }

  addGuardian(): void {
    this.editingGuardianId = null;
    this.guardianForm = this.emptyGuardian();
    this.guardianEditorOpen = true;
  }

  editGuardian(guardian: GuardianInfo): void {
    if (!guardian.guardianId) return;
    this.editingGuardianId = guardian.guardianId;
    this.guardianForm = {
      relationship: guardian.relation || 'GUARDIAN',
      firstName: guardian.firstName || guardian.name.split(/\s+/)[0] || '',
      lastName: guardian.lastName || guardian.name.split(/\s+/).slice(1).join(' '),
      mobile: guardian.mobile || '',
      email: guardian.email || '',
      occupation: guardian.occupation || '',
      organization: guardian.organization || '',
      qualification: guardian.qualification || '',
      isPrimaryContact: !!guardian.isPrimaryContact,
      isPickupAuthorized: !!guardian.isPickupAuthorized,
      receiveSms: true,
      receiveEmail: true
    };
    this.guardianEditorOpen = true;
  }

  saveGuardian(): void {
    if (!this.guardianForm.firstName.trim() || !this.guardianForm.mobile.trim()) {
      this.errorMessage = 'Guardian first name and mobile are required.';
      return;
    }
    this.guardianSaving = true;
    const request = this.editingGuardianId
      ? this.api.updateParent(this.studentId, this.editingGuardianId, this.guardianForm)
      : this.api.addParent(this.studentId, this.guardianForm);
    request.pipe(finalize(() => { this.guardianSaving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.guardianEditorOpen = false;
          this.errorMessage = '';
          this.loadAll();
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Unable to save guardian details.';
          this.cdr.markForCheck();
        }
      });
  }

  removeGuardian(guardian: GuardianInfo): void {
    if (!guardian.guardianId || !confirm(`Remove ${guardian.name} from this student? The parent record will be kept.`)) return;
    this.api.removeParent(this.studentId, guardian.guardianId).subscribe({
      next: () => this.loadAll(),
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to remove guardian.';
        this.cdr.markForCheck();
      }
    });
  }

  openDocumentUpload(): void {
    this.resetDocumentUpload();
    this.documentUploadOpen = true;
  }

  get documentFilterOptions(): { label: string; value: string | null }[] {
    return [{ label: 'All types', value: null }, ...this.documentTypes];
  }

  get filteredDocuments(): StudentDocumentEntry[] {
    return this.documentFilter
      ? this.studentDocs.filter(document => document.documentType === this.documentFilter)
      : this.studentDocs;
  }

  get canSubmitDocumentUpload(): boolean {
    return !this.documentUploadBusy
      && !!this.documentName.trim()
      && !!this.documentType
      && !!this.documentFile
      && !this.documentFileError;
  }

  get documentUploadMissing(): string | null {
    const missing: string[] = [];
    if (!this.documentName.trim()) missing.push('document name');
    if (!this.documentType) missing.push('document type');
    if (!this.documentFile) missing.push('file');
    return missing.length ? `Still needed: ${missing.join(', ')}.` : null;
  }

  documentTypeLabel(code: string): string {
    return this.documentTypes.find(type => type.value === code)?.label ?? code;
  }

  fileIcon(document: StudentDocumentEntry): string {
    const extension = (document.fileExtension || document.fileName?.split('.').pop() || '').toLowerCase();
    if (extension === 'pdf') return 'pi pi-file-pdf';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return 'pi pi-image';
    if (['xlsx', 'xls', 'csv'].includes(extension)) return 'pi pi-file-excel';
    return 'pi pi-file';
  }

  formatDocumentSize(size?: number | null): string {
    if (!size) return '—';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!this.allowedDocumentExtensions.includes(extension)) {
      this.documentFileError = 'Choose a PDF, image, Excel or CSV file.';
      return;
    }
    if (file.size > this.maxDocumentBytes) {
      this.documentFileError = 'File must be 5 MB or smaller.';
      return;
    }
    this.documentFile = file;
    this.documentFileError = '';
    this.documentError = '';
  }

  uploadDocument(): void {
    if (!this.canSubmitDocumentUpload || !this.documentFile || !this.documentType) {
      this.documentNameTouched = true;
      return;
    }
    const name = this.documentName.trim();
    this.documentUploadBusy = true;
    this.documentError = '';
    this.api.uploadStudentDocument(this.studentId, this.documentFile, this.documentType, name)
      .pipe(finalize(() => { this.documentUploadBusy = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.documentUploadOpen = false;
          this.resetDocumentUpload();
          this.messages.add({ severity: 'success', summary: 'Document uploaded', detail: `"${name}" was added to this profile.` });
          this.refreshDocuments();
        },
        error: err => { this.documentError = this.documentUploadErrorMessage(err); this.cdr.markForCheck(); }
      });
  }

  requestCloseDocumentUpload(): void {
    if (this.documentUploadBusy) return;
    if (this.documentUploadDirty && !confirm('Discard this document? The entered details will be lost.')) return;
    this.documentUploadOpen = false;
    this.resetDocumentUpload();
  }

  onDocumentUploadVisibleChange(visible: boolean): void {
    if (visible) return;
    if (this.documentUploadBusy || (this.documentUploadDirty && !confirm('Discard this document? The entered details will be lost.'))) {
      this.reopenDocumentUpload();
      return;
    }
    this.documentUploadOpen = false;
    this.resetDocumentUpload();
  }

  private reopenDocumentUpload(): void {
    this.documentUploadOpen = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.documentUploadOpen = true;
      this.cdr.markForCheck();
    }, 0);
  }

  private get documentUploadDirty(): boolean {
    return this.documentName.trim().length > 0 || !!this.documentType || !!this.documentFile;
  }

  private resetDocumentUpload(): void {
    this.documentName = '';
    this.documentType = null;
    this.documentFile = null;
    this.documentFileError = '';
    this.documentNameTouched = false;
    this.documentError = '';
  }

  private documentUploadErrorMessage(error: any): string {
    if (error?.status === 0) return 'We could not reach the server. Check your connection and try again. Your details are still filled in.';
    if (error?.status === 403) return 'You do not have permission to add documents to this Student profile.';
    if (error?.status === 404) return 'This Student could not be found. Refresh the page and try again.';
    if (error?.status >= 500) return 'The server could not save this document. Your details are still filled in; try again.';
    return error?.error?.message || 'The document could not be uploaded. Check the name, type, and file, then try again.';
  }

  replaceDocument(doc: StudentDocumentEntry, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file || !doc.documentId) return;
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'File must be 5 MB or smaller.';
      return;
    }
    this.documentBusy = true;
    this.documentError = '';
    this.api.replaceStudentDocument(this.studentId, doc.documentId, file)
      .pipe(finalize(() => { this.documentBusy = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Document replaced', detail: 'The file was updated.' }); this.refreshDocuments(); },
        error: () => { this.documentError = 'Unable to replace document.'; this.cdr.markForCheck(); }
      });
  }

  verifyDocument(doc: StudentDocumentEntry): void {
    if (!doc.documentId) return;
    this.documentBusy = true;
    this.documentError = '';
    this.api.verifyDocument(doc.documentId).pipe(finalize(() => { this.documentBusy = false; this.cdr.markForCheck(); })).subscribe({
      next: () => this.refreshDocuments(),
      error: () => { this.documentError = 'Unable to verify document.'; }
    });
  }

  removeDocument(doc: StudentDocumentEntry): void {
    if (!doc.documentId || !confirm(`Remove ${doc.displayLabel || doc.documentName}? The stored record will be retained.`)) return;
    this.documentBusy = true;
    this.documentError = '';
    this.api.deleteDocument(doc.documentId).pipe(finalize(() => { this.documentBusy = false; this.cdr.markForCheck(); })).subscribe({
      next: () => { this.messages.add({ severity: 'success', summary: 'Document removed', detail: 'The document was removed from this profile.' }); this.refreshDocuments(); },
      error: () => { this.documentError = 'Unable to remove document.'; }
    });
  }

  previewDocument(doc: StudentDocumentEntry): void {
    if (!doc.documentId) return;
    const source = this.api.downloadDocument(doc.documentId).pipe(map(blob => ({
      blob,
      contentType: blob.type || doc.mimeType || 'application/octet-stream',
      fileName: doc.fileName || doc.documentName || null
    })));
    this.previewDialog?.openSource(doc.fileName || doc.documentName || 'Student document', source);
  }

  private refreshDocuments(): void {
    this.api.studentDocuments(this.studentId).subscribe({
      next: docs => { this.studentDocs = docs; this.cdr.markForCheck(); },
      error: () => { this.errorMessage = 'Unable to refresh documents.'; this.cdr.markForCheck(); }
    });
  }

  changeStudentStatus(): void {
    if (!this.profile) return;
    const active = this.profile.overview.status === 'ACTIVE';
    const next = active ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`${active ? 'Deactivate' : 'Activate'} ${this.profile.overview.fullName}?`)) return;
    this.api.updateStudentStatus(this.studentId, next).subscribe({
      next: () => {
        if (this.profile) {
          this.profile.overview.status = next;
          this.profile.overview.active = next === 'ACTIVE';
        }
        this.moreActionsOpen = false;
        this.cdr.markForCheck();
      },
      error: () => { this.errorMessage = `Unable to ${active ? 'deactivate' : 'activate'} student.`; this.cdr.markForCheck(); }
    });
  }

  get studentIsActive(): boolean {
    return this.profile?.overview.status === 'ACTIVE';
  }

  get studentCanChangeStatus(): boolean {
    return this.profile?.overview.status === 'ACTIVE' || this.profile?.overview.status === 'INACTIVE';
  }

  setTimelineFilter(filter: TimelineFilter): void { this.timelineFilter = filter; }

  get filteredTimeline(): StudentTimelineEntry[] {
    if (this.timelineFilter === 'ALL') return this.timeline;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cutoff =
      this.timelineFilter === 'TODAY' ? now - dayMs
      : this.timelineFilter === 'WEEK' ? now - 7 * dayMs
      : now - 30 * dayMs;
    return this.timeline.filter(t => {
      const ts = new Date(t.performedAt).getTime();
      return !Number.isNaN(ts) && ts >= cutoff;
    });
  }

  downloadDoc(doc: StudentDocumentEntry): void {
    if (!doc.documentId) return;
    this.api.downloadDocument(doc.documentId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.documentName || doc.displayLabel || 'document';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.errorMessage = 'Unable to download document.'; this.cdr.markForCheck(); }
    });
  }

  formatAddress(line1?: string | null, city?: string | null, state?: string | null, pin?: string | null): string {
    const parts = [line1, [city, state].filter(Boolean).join(', '), pin].filter(p => !!p && String(p).trim());
    return parts.length ? parts.join('\n') : '—';
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  dash(value?: string | number | null): string {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }
}
