import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

import { ApplicationDocument } from '../../models/admissions-crm.model';
import { AdmissionsCrmService, DocumentBlobResult } from '../../services/admissions-crm.service';

type PreviewKind = 'image' | 'pdf' | 'unsupported';

@Component({
  selector: 'app-document-preview-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule],
  template: `
    <p-dialog
      [header]="title"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(920px, 96vw)' }"
      [contentStyle]="{ padding: '0', overflow: 'hidden' }"
      styleClass="adm-doc-preview-dialog"
      (onHide)="close()"
    >
      <div class="adm-doc-preview" *ngIf="visible">
        <div class="adm-doc-preview__loading" *ngIf="loading">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading preview…</span>
        </div>

        <ng-container *ngIf="!loading && objectUrl">
          <img *ngIf="kind === 'image'" class="adm-doc-preview__media" [src]="objectUrl" [alt]="fileName" />
          <iframe
            *ngIf="kind === 'pdf' && safeFrameUrl"
            class="adm-doc-preview__frame"
            [src]="safeFrameUrl"
            title="Document preview"
          ></iframe>
          <div class="adm-doc-preview__fallback" *ngIf="kind === 'unsupported'">
            <i class="pi pi-file"></i>
            <p>Preview is not available for this file type.</p>
            <span>{{ fileName }}</span>
          </div>
        </ng-container>

        <div class="adm-doc-preview__error" *ngIf="!loading && error">
          <i class="pi pi-exclamation-triangle"></i>
          <p>{{ error }}</p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="adm-dialog-actions">
          <button type="button" class="tc-btn" (click)="close()">Close</button>
          <button
            type="button"
            class="tc-btn tc-btn--primary"
            [disabled]="!blob || loading"
            (click)="download()"
          >
            <i class="pi pi-download"></i> Download
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class DocumentPreviewDialogComponent implements OnDestroy {
  private readonly api = inject(AdmissionsCrmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);

  visible = false;
  loading = false;
  title = 'Document preview';
  fileName = '';
  kind: PreviewKind = 'unsupported';
  objectUrl: string | null = null;
  safeFrameUrl: SafeResourceUrl | null = null;
  blob: Blob | null = null;
  error = '';

  open(doc: ApplicationDocument): void {
    this.close(false);
    this.visible = true;
    this.loading = true;
    this.error = '';
    this.fileName = doc.originalName || `document-${doc.documentId}`;
    this.title = this.fileName;
    this.kind = this.detectKind(this.fileName, null);
    this.cdr.markForCheck();

    this.api
      .downloadDocumentBlob(doc.documentId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (result: DocumentBlobResult) => {
          this.blob = result.blob;
          this.fileName = result.fileName || this.fileName;
          this.title = this.fileName;
          this.kind = this.detectKind(this.fileName, result.contentType);
          this.objectUrl = URL.createObjectURL(result.blob);
          this.safeFrameUrl = this.kind === 'pdf'
            ? this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl)
            : null;
        },
        error: () => {
          this.error = 'Could not open this document. Check your access and try again.';
          this.messages.add({
            severity: 'error',
            summary: 'Preview failed',
            detail: this.error
          });
        }
      });
  }

  download(): void {
    if (!this.blob) return;
    const url = URL.createObjectURL(this.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.fileName || 'document';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  close(hideDialog = true): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.safeFrameUrl = null;
    this.blob = null;
    this.error = '';
    this.loading = false;
    if (hideDialog) {
      this.visible = false;
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.close(false);
  }

  private detectKind(fileName: string, contentType: string | null): PreviewKind {
    const name = (fileName || '').toLowerCase();
    const type = (contentType || '').toLowerCase();
    if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/.test(name)) {
      return 'image';
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return 'pdf';
    }
    return 'unsupported';
  }
}
