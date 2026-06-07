import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import {
  DocumentVaultCategory,
  DocumentVaultEntry,
  DocumentVaultKpi,
  DocumentVaultRequest,
  StudentDirectoryCard
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

interface KpiTile {
  key: keyof DocumentVaultKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-document-vault',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './document-vault.component.html'
})
export class DocumentVaultComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  kpi: DocumentVaultKpi = { totalDocuments: 0, verifiedDocuments: 0, pendingVerification: 0, missingDocuments: 0 };
  entries: DocumentVaultEntry[] = [];
  students: StudentDirectoryCard[] = [];

  readonly kpiTiles: KpiTile[] = [
    { key: 'totalDocuments',      label: 'Total Documents', hint: 'All categories',       tone: 'info' },
    { key: 'verifiedDocuments',   label: 'Verified',        hint: 'Marked as approved',   tone: 'success' },
    { key: 'pendingVerification', label: 'Pending Review',  hint: 'Awaiting verification', tone: 'warning' },
    { key: 'missingDocuments',    label: 'Missing',          hint: 'Required but not uploaded', tone: 'danger' }
  ];

  readonly categories: ('ALL' | DocumentVaultCategory)[] = ['ALL', 'PERSONAL', 'ACADEMIC', 'MEDICAL', 'OTHER'];
  activeCategory: 'ALL' | DocumentVaultCategory = 'ALL';
  showUpload = false;
  showBulk = false;
  bulkCsv = 'studentId,category,documentType,fileName,fileUrl\n1,PERSONAL,Aadhaar Card,rahul_aadhaar.pdf,uploads/dev/students/1/rahul_aadhaar.pdf\n2,ACADEMIC,Previous Marksheet,ananya_marksheet.pdf,uploads/dev/students/2/ananya_marksheet.pdf';
  form: DocumentVaultRequest = this.emptyForm();

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      kpi: this.api.documentKpi(),
      docs: this.api.documents(this.activeCategory === 'ALL' ? undefined : this.activeCategory),
      students: this.api.search({})
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, docs, students }) => {
          this.kpi = kpi;
          this.entries = docs;
          this.students = students;
        },
        error: () => { this.errorMessage = 'Could not load documents.'; }
      });
  }

  filterCategory(c: 'ALL' | DocumentVaultCategory): void {
    this.activeCategory = c;
    this.loading = true;
    this.api.documents(c === 'ALL' ? undefined : c)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: docs => { this.entries = docs; },
        error: () => { this.errorMessage = 'Could not filter documents.'; }
      });
  }

  statusTone(s: string): string {
    return s === 'VERIFIED' ? 'success'
         : s === 'PENDING'  ? 'warning'
         : s === 'MISSING'  ? 'danger'
         : 'neutral';
  }

  emptyForm(): DocumentVaultRequest {
    return {
      studentId: 0,
      category: 'PERSONAL',
      documentType: '',
      fileName: '',
      fileUrl: '',
      status: 'PENDING',
      expiresOn: null,
      remarks: ''
    };
  }

  openUpload(): void {
    this.form = this.emptyForm();
    this.showUpload = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeUpload(): void {
    this.showUpload = false;
  }

  openBulk(): void {
    this.showBulk = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeBulk(): void {
    this.showBulk = false;
  }

  saveDocument(): void {
    if (!this.form.studentId || !this.form.documentType || !this.form.fileName) {
      this.errorMessage = 'Student, document type, and file name are required.';
      return;
    }
    this.saving = true;
    this.api.addDocument(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.successMessage = 'Document uploaded.';
          this.closeUpload();
          this.loadAll();
        },
        error: () => { this.errorMessage = 'Could not upload document.'; }
      });
  }

  saveBulk(): void {
    const rows = this.parseBulkRows();
    if (!rows.length || this.errorMessage) return;
    this.saving = true;
    forkJoin(rows.map(row => this.api.addDocument(row)))
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.successMessage = `${rows.length} document(s) uploaded.`;
          this.closeBulk();
          this.loadAll();
        },
        error: () => { this.errorMessage = 'Bulk upload failed. Check student IDs and required columns.'; }
      });
  }

  verify(d: DocumentVaultEntry): void {
    this.api.verifyDocument(d.documentId).subscribe({
      next: () => {
        this.successMessage = `${d.documentType} verified.`;
        this.loadAll();
      },
      error: () => { this.errorMessage = 'Could not verify document.'; }
    });
  }

  deleteDocument(d: DocumentVaultEntry): void {
    if (!window.confirm(`Delete ${d.documentType} for ${d.studentName}?`)) return;
    this.api.deleteDocument(d.documentId).subscribe({
      next: () => {
        this.successMessage = 'Document deleted.';
        this.loadAll();
      },
      error: () => { this.errorMessage = 'Could not delete document.'; }
    });
  }

  openFile(d: DocumentVaultEntry): void {
    if (d.fileUrl) {
      window.open(d.fileUrl, '_blank');
    }
  }

  private parseBulkRows(): DocumentVaultRequest[] {
    this.errorMessage = '';
    const lines = this.bulkCsv.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      this.errorMessage = 'Paste a header row and at least one document row.';
      return [];
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const required = ['studentId', 'category', 'documentType', 'fileName'];
    const missing = required.filter(key => !headers.includes(key));
    if (missing.length) {
      this.errorMessage = `Missing columns: ${missing.join(', ')}`;
      return [];
    }
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row = headers.reduce<Record<string, string>>((acc, key, i) => ({ ...acc, [key]: values[i] ?? '' }), {});
      required.forEach(key => {
        if (!row[key]) this.errorMessage = `Row ${index + 2} is missing ${key}.`;
      });
      return {
        studentId: Number(row['studentId']),
        category: (row['category'] as DocumentVaultCategory) || 'OTHER',
        documentType: row['documentType'],
        fileName: row['fileName'],
        fileUrl: row['fileUrl'] || null,
        status: 'PENDING',
        expiresOn: row['expiresOn'] || null,
        remarks: row['remarks'] || null
      };
    });
  }
}
