import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { RouterLink } from '@angular/router';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { FeesApiService } from '../../services/fees-api.service';
import { FEES_RESOURCES, FeeReceipt } from '../../models/fees.model';

@Component({
  selector: 'app-fees-receipts-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule, RouterLink,
    AppToastComponent, SaasPageHeaderComponent, TcAcademicYearSelectorComponent,
    HasPermissionDirective, TcPageSkeletonComponent
  ],
  templateUrl: './fees-receipts-page.component.html',
  styleUrls: ['./fees-receipts-page.component.scss', '../../fees.shared.scss']
})
export class FeesReceiptsPageComponent {
  private readonly api = inject(FeesApiService);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = FEES_RESOURCES;

  academicYearId: number | null = null;
  q = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: FeeReceipt[] = [];
  loading = true;
  error: string | null = null;

  previewVisible = false;
  previewLoading = false;
  preview: FeeReceipt | null = null;
  downloadingId: number | null = null;

  onAcademicYearChange(yearId: number | null): void {
    this.academicYearId = yearId;
    this.page = 0;
    this.rows = [];
    this.total = 0;
    if (yearId == null) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.listReceipts({
      q: this.q.trim() || undefined,
      academicYearId: this.academicYearId ?? undefined
    }, this.page, this.size).pipe(finalizeBusy(v => (this.loading = v))).subscribe({
      next: page => {
        this.rows = page.content;
        this.total = page.totalElements;
      },
      error: err => {
        this.error = extractApiError(err, 'Request failed').message || 'Failed to load receipts';
      }
    });
  }

  search(): void {
    this.page = 0;
    this.load();
  }

  reset(): void {
    this.q = '';
    this.page = 0;
    this.load();
  }

  openPreview(row: FeeReceipt): void {
    this.previewVisible = true;
    this.preview = null;
    this.previewLoading = true;
    this.api.previewReceipt(row.feeReceiptId).pipe(finalizeBusy(v => (this.previewLoading = v))).subscribe({
      next: receipt => {
        this.preview = receipt;
      },
      error: err => {
        this.previewVisible = false;
        this.feedback.error('Preview failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  download(row: FeeReceipt): void {
    this.downloadingId = row.feeReceiptId;
    this.api.downloadReceiptPdf(row.feeReceiptId).pipe(finalizeBusy(() => (this.downloadingId = null))).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${row.receiptNumber || row.feeReceiptId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => {
        this.feedback.error('Download failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  classLabel(row: FeeReceipt): string {
    if (!row.className && !row.sectionName) return '—';
    return row.sectionName ? `${row.className || '—'} / ${row.sectionName}` : (row.className || '—');
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if ((this.page + 1) * this.size >= this.total) return;
    this.page += 1;
    this.load();
  }
}
