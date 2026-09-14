import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { map } from 'rxjs';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { environment } from '../../../../../environments/environment';
import { FeesApiService } from '../../services/fees-api.service';
import { FEES_RESOURCES, FeeReceipt } from '../../models/fees.model';

interface LookupOption { id: number; name: string; }

@Component({
  selector: 'app-fees-receipts-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule,
    AppToastComponent, SaasPageHeaderComponent, HasPermissionDirective
  ],
  templateUrl: './fees-receipts-page.component.html',
  styleUrls: ['./fees-receipts-page.component.scss', '../../fees.shared.scss']
})
export class FeesReceiptsPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly http = inject(HttpClient);
  private readonly feedback = inject(UiFeedbackService);

  readonly resources = FEES_RESOURCES;

  years: LookupOption[] = [];
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

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/academic-years`)
      .pipe(map(r => r.data ?? []))
      .subscribe({
        next: years => {
          this.years = years;
          this.academicYearId = years[0]?.id ?? null;
          this.load();
        },
        error: err => {
          this.loading = false;
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load academic years';
        }
      });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.listReceipts({
      q: this.q.trim() || undefined,
      academicYearId: this.academicYearId ?? undefined
    }, this.page, this.size).subscribe({
      next: page => {
        this.rows = page.content;
        this.total = page.totalElements;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
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
    this.academicYearId = this.years[0]?.id ?? null;
    this.page = 0;
    this.load();
  }

  onYearChange(): void {
    this.page = 0;
    this.load();
  }

  openPreview(row: FeeReceipt): void {
    this.previewVisible = true;
    this.preview = null;
    this.previewLoading = true;
    this.api.previewReceipt(row.feeReceiptId).subscribe({
      next: receipt => {
        this.preview = receipt;
        this.previewLoading = false;
      },
      error: err => {
        this.previewLoading = false;
        this.previewVisible = false;
        this.feedback.error('Preview failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  download(row: FeeReceipt): void {
    this.downloadingId = row.feeReceiptId;
    this.api.downloadReceiptPdf(row.feeReceiptId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${row.receiptNumber || row.feeReceiptId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: err => {
        this.downloadingId = null;
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
