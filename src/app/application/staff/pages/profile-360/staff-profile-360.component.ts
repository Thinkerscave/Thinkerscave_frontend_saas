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
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
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
} from '../../models/staff.model';
import { StaffService, saveBlobAsFile } from '../../services/staff.service';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { DocumentPreviewDialogComponent } from '../../../admissions/components/document-preview-dialog/document-preview-dialog.component';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi';

import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
type ProfileTab = 'overview' | 'responsibilities' | 'documents' | 'activity';

interface TabConfig { id: ProfileTab; label: string; icon: string; }

@Component({
  selector: 'app-staff-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, AvatarComponent, SaasPageHeaderComponent,
    TcPageSkeletonComponent, AppToastComponent, DocumentPreviewDialogComponent, KpiCardComponent, KpiGroupComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../staff.shared.scss', './staff-profile-360.component.scss'],
  templateUrl: './staff-profile-360.component.html'
})
export class StaffProfile360Component implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly api = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeader = inject(BreadCrumbService);

  loading = true;
  errorMessage = '';
  actionLoading = false;

  staffId = 0;
  profile?: StaffDetail;
  photoUrl: string | null = null;
  @ViewChild(DocumentPreviewDialogComponent) private previewDialog?: DocumentPreviewDialogComponent;

  // ── Documents ────────────────────────────────────────────────────────────────
  readonly documentTypes = STAFF_DOCUMENT_TYPES;
  documentType = 'OTHER';
  documentBusy = false;
  documentError = '';

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
          this.loadPhoto();
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

  get yearsInService(): number | null {
    return this.yearsSince(this.profile?.joiningDate);
  }

  get age(): number | null {
    return this.yearsSince(this.profile?.dateOfBirth);
  }

  get activeDocumentCount(): number {
    return this.documents.length;
  }

  // ── Quick Actions ────────────────────────────────────────────────────────────

  editProfile(): void {
    this.router.navigate(['/app/staff/edit', this.staffId]);
  }

  toggleActive(): void {
    if (!this.profile) { return; }
    this.actionLoading = true;
    const obs = this.profile.active
      ? this.api.deactivateStaff(this.staffId)
      : this.api.activateStaff(this.staffId);
    obs.pipe(finalize(() => { this.actionLoading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: () => { if (this.profile) { this.profile.active = !this.profile.active; } } });
  }

  // ── Assign Responsibility ────────────────────────────────────────────────────

  openAssignModal(): void {
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

  formatAddress(a?: StaffAddress | null): string {
    if (!a) { return ''; }
    return [a.addressLine1, a.addressLine2, a.landmark, a.city, a.district, a.state, a.postalCode, a.country]
      .map(v => v?.trim())
      .filter((v): v is string => !!v)
      .join(', ');
  }

  get documents(): StaffDocumentResponse[] {
    return (this.profile?.documents ?? []).filter(d => d.active);
  }

  documentTypeLabel(code: string): string {
    return STAFF_DOCUMENT_TYPES.find(t => t.value === code)?.label ?? code;
  }

  onDocumentSelected(event: Event, documentId?: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) { return; }
    this.documentBusy = true;
    this.documentError = '';
    const request$ = documentId
      ? this.api.replaceStaffDocument(this.staffId, documentId, file)
      : this.api.uploadStaffDocument(this.staffId, file, this.documentType);
    request$.pipe(finalize(() => { this.documentBusy = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.refreshDocuments(),
        error: () => { this.documentError = 'Unable to save the document. Please try again.'; }
      });
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
    if (!confirm(`Remove document "${doc.documentName}"?`)) { return; }
    this.documentBusy = true;
    this.api.deactivateStaffDocument(this.staffId, doc.documentId)
      .pipe(finalize(() => { this.documentBusy = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.refreshDocuments(),
        error: () => { this.documentError = 'Unable to remove the document.'; }
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
    return Math.max(0, Math.floor(ms / (365.25 * 24 * 3600 * 1000)));
  }
}
