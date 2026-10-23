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
import { Observable, finalize } from 'rxjs';

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
      [style]="fullscreen ? fullscreenStyle : windowStyle"
      [contentStyle]="{ padding: '0', overflow: 'hidden' }"
      styleClass="adm-doc-preview-dialog"
      (onHide)="close()"
    >
      <div class="adm-doc-preview" [class.adm-doc-preview--fullscreen]="fullscreen" *ngIf="visible">
        <div class="adm-doc-toolbar" *ngIf="!loading && objectUrl">
          <div class="adm-doc-toolbar__group" *ngIf="kind !== 'unsupported'">
            <button type="button" class="adm-doc-tool" title="Zoom out" aria-label="Zoom out"
                    [disabled]="!canZoomOut" (click)="zoomOut()">
              <i class="pi pi-search-minus"></i>
            </button>
            <button type="button" class="adm-doc-tool adm-doc-tool--label" title="Reset zoom"
                    (click)="resetZoom()">{{ zoomPercent }}%</button>
            <button type="button" class="adm-doc-tool" title="Zoom in" aria-label="Zoom in"
                    [disabled]="!canZoomIn" (click)="zoomIn()">
              <i class="pi pi-search-plus"></i>
            </button>
          </div>
          <div class="adm-doc-toolbar__group">
            <button type="button" class="adm-doc-tool"
                    [attr.title]="fullscreen ? 'Exit full screen' : 'Full screen'"
                    [attr.aria-label]="fullscreen ? 'Exit full screen' : 'Full screen'"
                    (click)="toggleFullscreen()">
              <i class="pi" [ngClass]="fullscreen ? 'pi-window-minimize' : 'pi-window-maximize'"></i>
            </button>
          </div>
        </div>

        <div class="adm-doc-preview__stage" (wheel)="onWheel($event)">
          <div class="adm-doc-preview__loading" *ngIf="loading">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading preview…</span>
          </div>

          <ng-container *ngIf="!loading && objectUrl">
            <img *ngIf="kind === 'image'" class="adm-doc-preview__media" [class.is-zoomed]="zoom !== 1"
                 [style.width]="zoom !== 1 ? zoomPercent + '%' : null" [src]="objectUrl" [alt]="fileName" />
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
  `,
  styles: [`
    :host ::ng-deep .adm-doc-preview-dialog.p-dialog { max-height: min(92vh, 900px); }
    :host ::ng-deep .adm-doc-preview-dialog .p-dialog-content { background: #0f172a0a; }

    .adm-doc-preview {
      height: min(72vh, 680px);
      display: flex;
      flex-direction: column;
      background: #0b1220;
    }

    .adm-doc-preview--fullscreen {
      height: calc(100vh - 140px);
    }

    .adm-doc-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      background: #111827;
      border-bottom: 1px solid #1e293b;
    }

    .adm-doc-toolbar__group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .adm-doc-tool {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 30px;
      padding: 0 8px;
      border: 1px solid #334155;
      border-radius: 6px;
      background: transparent;
      color: #e2e8f0;
      font-size: 0.85rem;
      cursor: pointer;

      &:hover:not(:disabled) { background: #1e293b; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .adm-doc-tool--label {
      min-width: 60px;
      font-variant-numeric: tabular-nums;
    }

    .adm-doc-preview__stage {
      flex: 1;
      min-height: 0;
      display: flex;
      overflow: auto;
    }

    .adm-doc-preview__loading,
    .adm-doc-preview__fallback,
    .adm-doc-preview__error {
      margin: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.65rem;
      color: #e2e8f0;
      padding: 2rem;
      text-align: center;

      i { font-size: 1.75rem; }
      p { margin: 0; }
      span { opacity: 0.75; font-size: 0.9rem; }
    }

    .adm-doc-preview__media {
      display: block;
      margin: auto;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;

      &.is-zoomed {
        max-width: none;
        max-height: none;
        object-fit: unset;
      }
    }

    .adm-doc-preview__frame {
      width: 100%;
      height: 100%;
      border: 0;
      background: #fff;
    }
  `]
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

  readonly windowStyle = { width: 'min(1040px, 96vw)' };
  readonly fullscreenStyle = { width: '100vw', height: '100vh', maxHeight: '100vh' };
  readonly zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
  zoom = 1;
  fullscreen = false;

  get zoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  get canZoomIn(): boolean {
    return this.zoom < this.zoomLevels[this.zoomLevels.length - 1];
  }

  get canZoomOut(): boolean {
    return this.zoom > this.zoomLevels[0];
  }

  open(doc: ApplicationDocument): void {
    this.openSource(doc.originalName || `document-${doc.documentId}`, this.api.downloadDocumentBlob(doc.documentId));
  }

  openSource(fileName: string, source$: Observable<DocumentBlobResult>): void {
    this.close(false);
    this.visible = true;
    this.loading = true;
    this.error = '';
    this.fileName = fileName;
    this.title = fileName;
    this.kind = this.detectKind(fileName, null);
    this.zoom = 1;
    this.cdr.markForCheck();

    source$
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
          this.updateFrameUrl();
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

  zoomIn(): void {
    this.setZoom(this.zoomLevels.find(z => z > this.zoom) ?? this.zoom);
  }

  zoomOut(): void {
    this.setZoom([...this.zoomLevels].reverse().find(z => z < this.zoom) ?? this.zoom);
  }

  resetZoom(): void {
    this.setZoom(1);
  }

  toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen;
    this.cdr.markForCheck();
  }

  onWheel(event: WheelEvent): void {
    if (!event.ctrlKey) return;
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  ngOnDestroy(): void {
    this.close(false);
  }

  private setZoom(level: number): void {
    this.zoom = level;
    this.updateFrameUrl();
    this.cdr.markForCheck();
  }

  /** Chrome's built-in PDF viewer honours the #zoom fragment. */
  private updateFrameUrl(): void {
    if (this.kind !== 'pdf' || !this.objectUrl) {
      this.safeFrameUrl = null;
      return;
    }
    this.safeFrameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.objectUrl}#zoom=${this.zoomPercent}`);
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
