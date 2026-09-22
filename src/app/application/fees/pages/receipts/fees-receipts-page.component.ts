import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { UI_PAGINATION, UI_SEARCH } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { environment } from '../../../../../environments/environment';
import { FeesApiService } from '../../services/fees-api.service';
import { FEES_RESOURCES, FeeReceipt, PaymentMethod } from '../../models/fees.model';

interface LookupOption {
  id: number;
  name: string;
  status?: string;
}

@Component({
  selector: 'app-fees-receipts-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    RouterLink,
    AppToastComponent,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    HasPermissionDirective,
    TcPageSkeletonComponent,
    AppPaginatorComponent
  ],
  templateUrl: './fees-receipts-page.component.html',
  styleUrls: ['./fees-receipts-page.component.scss', '../../fees.shared.scss']
})
export class FeesReceiptsPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly http = inject(HttpClient);
  private readonly feedback = inject(UiFeedbackService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly resources = FEES_RESOURCES;
  readonly pageSizeOptions = UI_PAGINATION.options;

  private readonly search$ = new Subject<string>();
  private yearReady = false;

  classes: LookupOption[] = [];
  paymentMethods: PaymentMethod[] = [];

  academicYearId: number | null = null;
  q = '';
  classId: number | null = null;
  paymentMethod = '';
  fromDate = '';
  toDate = '';
  studentId: number | null = null;
  studentNameChip: string | null = null;
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

  get hasActiveFilters(): boolean {
    return (
      !!this.q.trim() ||
      this.classId != null ||
      !!this.paymentMethod ||
      !!this.fromDate ||
      !!this.toDate ||
      this.studentId != null
    );
  }

  get isFilterEmptyState(): boolean {
    return this.hasActiveFilters && !this.rows.length && !this.loading && !this.error;
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const sid = qp.get('studentId');
    if (sid) {
      const n = Number(sid);
      if (!Number.isNaN(n)) this.studentId = n;
    }
    const name = qp.get('studentName');
    this.studentNameChip = name?.trim() || null;

    this.http
      .get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/classes`)
      .pipe(map(r => r.data ?? []))
      .subscribe({
        next: classes => {
          this.classes = classes;
          this.cdr.markForCheck();
        },
        error: () => {
          this.classes = [];
          this.cdr.markForCheck();
        }
      });

    this.api.listPaymentMethods('ACTIVE').subscribe({
      next: methods => {
        this.paymentMethods = methods ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.paymentMethods = [];
        this.cdr.markForCheck();
      }
    });

    this.search$
      .pipe(debounceTime(UI_SEARCH.debounceMs), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.load({ soft: true });
      });
  }

  onAcademicYearChange(yearId: number | null): void {
    this.academicYearId = yearId;
    this.yearReady = true;
    this.page = 0;
    this.rows = [];
    this.total = 0;
    this.loading = true;
    this.cdr.markForCheck();
    this.load();
  }

  onSearchChange(value: string): void {
    this.q = value ?? '';
    this.search$.next(this.q.trim());
  }

  onClassChange(value: number | null): void {
    this.classId = value;
    this.page = 0;
    this.load({ soft: true });
  }

  onPaymentMethodChange(value: string): void {
    this.paymentMethod = value ?? '';
    this.page = 0;
    this.load({ soft: true });
  }

  onFromDateChange(value: string): void {
    this.fromDate = value ?? '';
    this.page = 0;
    this.load({ soft: true });
  }

  onToDateChange(value: string): void {
    this.toDate = value ?? '';
    this.page = 0;
    this.load({ soft: true });
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.size) {
      this.size = event.rows;
      this.page = 0;
    }
    this.load({ soft: true });
  }

  clearFilters(): void {
    this.q = '';
    this.classId = null;
    this.paymentMethod = '';
    this.fromDate = '';
    this.toDate = '';
    this.page = 0;
    if (this.studentId != null) {
      this.clearStudentFilter();
      return;
    }
    this.load({ soft: true });
  }

  clearStudentFilter(): void {
    this.studentId = null;
    this.studentNameChip = null;
    this.page = 0;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { studentId: null, studentName: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.load({ soft: true });
  }

  load(opts?: { soft?: boolean }): void {
    if (!this.yearReady) return;
    const soft = !!opts?.soft && this.rows.length > 0;
    if (!soft) {
      this.loading = true;
      this.rows = [];
    } else {
      this.loading = true;
    }
    this.error = null;
    this.api
      .listReceipts(
        {
          q: this.q.trim() || undefined,
          academicYearId: this.academicYearId ?? undefined,
          studentId: this.studentId ?? undefined,
          classId: this.classId ?? undefined,
          paymentMethod: this.paymentMethod || undefined,
          fromDate: this.fromDate || undefined,
          toDate: this.toDate || undefined
        },
        this.page,
        this.size
      )
      .pipe(
        finalizeBusy(v => {
          this.loading = v;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: page => {
          this.rows = page?.content ?? [];
          this.total = page?.totalElements ?? 0;
          this.cdr.markForCheck();
        },
        error: err => {
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load receipts';
          this.cdr.markForCheck();
        }
      });
  }

  openPreview(row: FeeReceipt): void {
    this.previewVisible = true;
    this.preview = null;
    this.previewLoading = true;
    this.api
      .previewReceipt(row.feeReceiptId)
      .pipe(
        finalizeBusy(v => {
          this.previewLoading = v;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: receipt => {
          this.preview = receipt;
          this.cdr.markForCheck();
        },
        error: err => {
          this.previewVisible = false;
          this.feedback.error('Preview failed', extractApiError(err, 'Request failed').message);
          this.cdr.markForCheck();
        }
      });
  }

  download(row: FeeReceipt): void {
    this.downloadingId = row.feeReceiptId;
    this.api
      .downloadReceiptPdf(row.feeReceiptId)
      .pipe(
        finalizeBusy(() => {
          this.downloadingId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
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

  statusLabel(status: string | null | undefined): string {
    if (!status) return '—';
    const key = status.trim().toUpperCase();
    if (key === 'ISSUED') return 'Issued';
    if (key === 'APPLIED') return 'Applied';
    return status
      .toLowerCase()
      .split(/[_\s]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  statusTone(status: string | null | undefined): 'success' | 'muted' {
    const key = (status ?? '').trim().toUpperCase();
    return key === 'ISSUED' || key === 'APPLIED' ? 'success' : 'muted';
  }
}
