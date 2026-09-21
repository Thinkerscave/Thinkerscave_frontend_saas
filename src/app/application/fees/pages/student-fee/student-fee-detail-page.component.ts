import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { BackNavigationService } from '../../../../core/services/back-navigation.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import { FeesApiService } from '../../services/fees-api.service';
import { CollectFeeDialogComponent } from '../../components/collect-fee-dialog/collect-fee-dialog.component';
import {
  BillingPeriodRow,
  BillingPeriodStatus,
  FEES_RESOURCES,
  FeePayment,
  FeeReceipt,
  StudentFeeDetail,
  StudentFeeListItem
} from '../../models/fees.model';

@Component({
  selector: 'app-student-fee-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DialogModule,
    HasPermissionDirective,
    AppToastComponent,
    CollectFeeDialogComponent,
    KpiCardComponent,
    KpiGroupComponent,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    TcPageSkeletonComponent
  ],
  templateUrl: './student-fee-detail-page.component.html',
  styleUrls: ['./student-fee-detail-page.component.scss', '../../fees.shared.scss']
})
export class StudentFeeDetailPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly backNav = inject(BackNavigationService);

  readonly resources = FEES_RESOURCES;

  studentId: number | null = null;
  academicYearId: number | null = null;

  loading = true;
  accessRestricted = false;
  error: string | null = null;

  detail: StudentFeeDetail | null = null;
  periods: BillingPeriodRow[] = [];
  payments: FeePayment[] = [];
  structureOpen = false;

  collectVisible = false;
  collectStudent: StudentFeeListItem | null = null;

  previewVisible = false;
  previewLoading = false;
  preview: FeeReceipt | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('studentId');
    this.studentId = id ? Number(id) : null;
    if (this.studentId == null || Number.isNaN(this.studentId)) {
      this.loading = false;
      this.error = 'Invalid student.';
    }
  }

  goBack(): void {
    this.backNav.back({ fallback: '/app/fees/students' });
  }

  onAcademicYearChange(yearId: number | null): void {
    this.academicYearId = yearId;
    if (yearId == null || this.studentId == null) {
      this.detail = null;
      this.periods = [];
      this.payments = [];
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.detail = null;
    this.periods = [];
    this.payments = [];
    this.loading = true;
    this.cdr.markForCheck();
    this.load();
  }

  load(): void {
    if (this.studentId == null || this.academicYearId == null) return;
    this.loading = true;
    this.error = null;
    this.accessRestricted = false;

    forkJoin({
      detail: this.api.studentDetail(this.studentId, this.academicYearId),
      periods: this.api.studentPeriods(this.studentId, this.academicYearId).pipe(catchError(() => of([] as BillingPeriodRow[]))),
      payments: this.api.studentPayments(this.studentId, this.academicYearId).pipe(catchError(() => of([] as FeePayment[])))
    })
      .pipe(
        finalizeBusy(v => {
          this.loading = v;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: data => {
          this.detail = data.detail;
          this.periods = data.periods ?? [];
          this.payments = (data.payments ?? []).slice(0, 8);
          this.pageHeader.setPageHeader({
            subtitle: [data.detail.admissionNumber, data.detail.className, data.detail.sectionName]
              .filter(Boolean)
              .join(' · ')
          });
          this.cdr.markForCheck();
        },
        error: err => {
          if (err?.status === 403) {
            this.accessRestricted = true;
            this.detail = null;
          } else {
            this.error = extractApiError(err, 'Request failed').message || 'Failed to load student fee details';
          }
          this.cdr.markForCheck();
        }
      });
  }

  openCollect(): void {
    if (!this.detail) return;
    this.collectStudent = {
      studentId: this.detail.studentId,
      studentName: this.detail.studentName,
      admissionNumber: this.detail.admissionNumber,
      className: this.detail.className,
      sectionName: this.detail.sectionName,
      totalFee: this.detail.kpis?.totalFee ?? 0,
      paid: this.detail.kpis?.paid ?? 0,
      outstanding: this.detail.kpis?.outstanding ?? 0,
      overdue: this.detail.kpis?.overdue ?? 0,
      advance: this.detail.kpis?.advance ?? 0,
      canCollectFee: this.detail.canCollectFee
    };
    this.collectVisible = true;
  }

  onCollected(): void {
    this.load();
  }

  openPreview(payment: FeePayment): void {
    const receiptId = payment.receiptId;
    if (receiptId == null) {
      this.feedback.error('Preview failed', 'No receipt is linked to this payment.');
      return;
    }
    this.previewVisible = true;
    this.preview = null;
    this.previewLoading = true;
    this.api.previewReceipt(receiptId).pipe(finalizeBusy(v => (this.previewLoading = v))).subscribe({
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

  downloadReceipt(row: FeeReceipt): void {
    this.api.downloadReceiptPdf(row.feeReceiptId).subscribe({
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

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  classSectionLabel(): string {
    if (!this.detail) return '';
    const cls = this.detail.className?.trim();
    const sec = this.detail.sectionName?.trim();
    if (cls && sec) return `${cls} · ${sec}`;
    return cls || sec || '';
  }

  statusLabel(status: BillingPeriodStatus | string | null | undefined): string {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'PARTIALLY_PAID':
        return 'Partially Paid';
      case 'OVERDUE':
        return 'Overdue';
      case 'DUE':
        return 'Due';
      default:
        return status ? String(status) : '—';
    }
  }

  statusTone(status: BillingPeriodStatus | string | null | undefined): string {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'info';
      case 'OVERDUE':
        return 'danger';
      case 'DUE':
        return 'warning';
      default:
        return 'muted';
    }
  }

  isActiveStudent(): boolean {
    const status = String(this.detail?.status || '').toUpperCase();
    return !status || status === 'ACTIVE';
  }
}
