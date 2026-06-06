import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { finalize, forkJoin } from 'rxjs';

import {
  StaffDirectoryCard,
  StaffDocumentEntry,
  StaffDocumentKpi,
  StaffDocumentRequest
} from '../../models/staff-workspace.model';
import { StaffWorkspaceService } from '../../services/staff-workspace.service';

interface CategoryOption { code: string; label: string; }

@Component({
  selector: 'app-staff-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../staff.shared.scss'],
  templateUrl: './staff-documents.component.html'
})
export class StaffDocumentsComponent implements OnInit {
  private readonly api = inject(StaffWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  loading = true;
  saving = false;
  errorMessage = '';

  kpi: StaffDocumentKpi = { total: 0, verified: 0, pending: 0, missing: 0, expired: 0 };
  documents: StaffDocumentEntry[] = [];
  staffOptions: StaffDirectoryCard[] = [];

  activeCategory = 'ALL';

  readonly categories: CategoryOption[] = [
    { code: 'ALL',        label: 'All Categories' },
    { code: 'IDENTITY',   label: 'Identity Documents' },
    { code: 'EDUCATION',  label: 'Qualification' },
    { code: 'EMPLOYMENT', label: 'Experience' },
    { code: 'BANKING',    label: 'Banking' },
    { code: 'CERTIFICATE',label: 'Certificates' },
    { code: 'MEDICAL',    label: 'Medical' },
    { code: 'OTHER',      label: 'Others' }
  ];

  showAdd = false;
  form: StaffDocumentRequest = this.emptyForm();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    forkJoin({
      kpi: this.api.documentKpi(),
      docs: this.api.documents(this.activeCategory === 'ALL' ? undefined : this.activeCategory),
      staff: this.api.search({})
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, docs, staff }) => { this.kpi = kpi; this.documents = docs; this.staffOptions = staff; },
        error: () => { this.errorMessage = 'Unable to load documents.'; }
      });
  }

  selectCategory(code: string): void {
    this.activeCategory = code;
    this.load();
  }

  countForCategory(code: string): number {
    if (code === 'ALL') { return this.kpi.total; }
    return this.documents.filter(d => d.category === code).length;
  }

  categoryLabel(code: string): string {
    return this.categories.find(c => c.code === code)?.label ?? code;
  }

  emptyForm(): StaffDocumentRequest {
    return {
      staffId: 0,
      category: 'IDENTITY',
      documentType: '',
      fileName: '',
      fileUrl: '',
      fileSize: undefined,
      expiresOn: undefined,
      remarks: ''
    };
  }

  openAdd(): void {
    this.form = this.emptyForm();
    this.showAdd = true;
  }

  closeAdd(): void { this.showAdd = false; }

  save(): void {
    if (!this.form.staffId || !this.form.documentType || !this.form.fileName) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Employee, document type, and file name are required.' });
      return;
    }
    this.saving = true;
    this.api.addDocument(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Document added to vault.' });
          this.closeAdd();
          this.load();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Upload failed.' })
      });
  }

  verify(d: StaffDocumentEntry): void {
    this.api.verifyDocument(d.documentId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Verified', detail: `${d.documentType} marked verified.` });
        this.load();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Verification failed.' })
    });
  }

  confirmDelete(d: StaffDocumentEntry): void {
    this.confirmationService.confirm({
      message: `Delete "${d.documentType}" for ${d.staffName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteDocument(d.documentId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Document removed.' });
            this.load();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Delete failed.' })
        });
      }
    });
  }

  trackById(_: number, d: StaffDocumentEntry): number { return d.documentId; }
}
