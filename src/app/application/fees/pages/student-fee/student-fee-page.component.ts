import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { map } from 'rxjs';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { BackNavigationService } from '../../../../core/services/back-navigation.service';
import { environment } from '../../../../../environments/environment';
import { FeesApiService } from '../../services/fees-api.service';
import { CollectFeeDialogComponent } from '../../components/collect-fee-dialog/collect-fee-dialog.component';
import {
  AcademicYearOption,
  BillingPeriodRow,
  FEES_RESOURCES,
  FeePayment,
  FeeReceipt,
  LinkedStudentOption,
  StudentFeeDetail,
  StudentFeeListItem
} from '../../models/fees.model';

interface LookupOption { id: number; name: string; status?: string; }

@Component({
  selector: 'app-student-fee-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, DialogModule, HasPermissionDirective,
    AppToastComponent, CollectFeeDialogComponent, KpiCardComponent, KpiGroupComponent, SaasPageHeaderComponent
  ],
  templateUrl: './student-fee-page.component.html',
  styleUrls: ['./student-fee-page.component.scss', '../../fees.shared.scss']
})
export class StudentFeePageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly backNav = inject(BackNavigationService);

  readonly resources = FEES_RESOURCES;

  years: LookupOption[] = [];
  classes: LookupOption[] = [];
  linked: LinkedStudentOption[] = [];
  academicYearId: number | null = null;
  selectedStudentId: number | null = null;

  canSearch = true;
  accessRestricted = false;
  listLoading = false;
  detailLoading = false;
  tabLoading = false;
  listError: string | null = null;
  detailError: string | null = null;

  q = '';
  classId: number | null = null;
  sectionId: number | null = null;
  status = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: StudentFeeListItem[] = [];

  detail: StudentFeeDetail | null = null;
  periods: BillingPeriodRow[] = [];
  payments: FeePayment[] = [];
  receipts: FeeReceipt[] = [];
  yearHistory: AcademicYearOption[] = [];
  activeTab: 'overview' | 'payments' | 'receipts' | 'years' = 'overview';
  collectVisible = false;
  collectStudent: StudentFeeListItem | null = null;

  previewVisible = false;
  previewLoading = false;
  preview: FeeReceipt | null = null;
  downloadingId: number | null = null;

  goBack(): void {
    this.backNav.back({ fallback: '/app/fees/students' });
  }

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/academic-years`)
      .pipe(map(r => r.data ?? []))
      .subscribe(years => {
        this.years = years;
        const current = years.find(y => String(y.status || '').toUpperCase() === 'CURRENT')
          ?? years.find(y => /2026-27/i.test(y.name))
          ?? years[0];
        this.academicYearId = current?.id ?? null;
        this.bootstrapScope();
        this.cdr.detectChanges();
      });
    this.http.get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/classes`)
      .pipe(map(r => r.data ?? []))
      .subscribe(classes => {
        this.classes = classes;
        this.cdr.detectChanges();
      });

    const routeStudentId = this.route.snapshot.paramMap.get('studentId');
    if (routeStudentId) {
      this.selectedStudentId = Number(routeStudentId);
    }
  }

  private bootstrapScope(): void {
    this.api.linkedStudents().subscribe({
      next: linked => { this.linked = linked; this.cdr.detectChanges(); },
      error: () => { this.linked = []; }
    });

    this.listLoading = true;
    this.api.listStudents({ academicYearId: this.academicYearId ?? undefined }, 0, 1).subscribe({
      next: () => {
        this.canSearch = true;
        this.listLoading = false;
        this.cdr.detectChanges();
        if (this.selectedStudentId) this.loadDetail();
        else this.search();
      },
      error: err => {
        this.listLoading = false;
        if (err?.status === 403) {
          this.canSearch = false;
          if (this.linked.length >= 1) {
            this.selectedStudentId = this.linked[0].studentId;
            this.loadDetail();
          } else {
            this.detailError = 'No fee records available.';
          }
        } else {
          this.listError = extractApiError(err, 'Request failed').message || 'Failed to load students';
        }
        this.cdr.detectChanges();
      }
    });
  }

  search(): void {
    if (!this.canSearch || this.academicYearId == null) return;
    this.listLoading = true;
    this.listError = null;
    this.api.listStudents({
      academicYearId: this.academicYearId,
      q: this.q || undefined,
      classId: this.classId ?? undefined,
      sectionId: this.sectionId ?? undefined,
      status: this.status || undefined
    }, this.page, this.size).subscribe({
      next: page => {
        this.rows = page.content;
        this.total = page.totalElements;
        this.listLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.listLoading = false;
        if (err?.status === 403) this.accessRestricted = true;
        else this.listError = extractApiError(err, 'Request failed').message || 'Failed to load students';
        this.cdr.detectChanges();
      }
    });
  }

  reset(): void {
    this.q = '';
    this.classId = null;
    this.sectionId = null;
    this.status = '';
    this.page = 0;
    this.search();
  }

  selectStudent(id: number): void {
    this.selectedStudentId = id;
    this.accessRestricted = false;
    this.activeTab = 'overview';
    this.loadDetail();
  }

  onChildChange(): void {
    this.activeTab = 'overview';
    this.loadDetail();
  }

  onYearChange(): void {
    if (this.canSearch) this.search();
    if (this.selectedStudentId) this.loadDetail();
  }

  loadDetail(): void {
    if (this.selectedStudentId == null || this.academicYearId == null) return;
    this.detailLoading = true;
    this.detailError = null;
    this.accessRestricted = false;
    this.payments = [];
    this.receipts = [];
    this.yearHistory = [];
    this.api.studentDetail(this.selectedStudentId, this.academicYearId).subscribe({
      next: detail => {
        this.detail = detail;
        this.detailLoading = false;
        this.pageHeader.setPageHeader({
          subtitle: [detail.admissionNumber, detail.className, detail.sectionName].filter(Boolean).join(' · ')
        });
        this.api.studentPeriods(this.selectedStudentId!, this.academicYearId!).subscribe({
          next: periods => this.periods = periods,
          error: () => this.periods = []
        });
        if (this.activeTab !== 'overview') this.loadActiveTab();
      },
      error: err => {
        this.detailLoading = false;
        if (err?.status === 403) {
          this.accessRestricted = true;
          this.detail = null;
        } else {
          this.detailError = extractApiError(err, 'Request failed').message || 'Failed to load student fee details';
        }
      }
    });
  }

  setTab(tab: 'overview' | 'payments' | 'receipts' | 'years'): void {
    this.activeTab = tab;
    if (tab !== 'overview') this.loadActiveTab();
  }

  private loadActiveTab(): void {
    if (this.selectedStudentId == null || this.academicYearId == null) return;
    this.tabLoading = true;
    if (this.activeTab === 'payments') {
      this.api.studentPayments(this.selectedStudentId, this.academicYearId).subscribe({
        next: rows => { this.payments = rows; this.tabLoading = false; },
        error: err => {
          this.tabLoading = false;
          this.payments = [];
          this.feedback.error('Payments', extractApiError(err, 'Request failed').message);
        }
      });
    } else if (this.activeTab === 'receipts') {
      this.api.studentReceipts(this.selectedStudentId, this.academicYearId).subscribe({
        next: rows => { this.receipts = rows; this.tabLoading = false; },
        error: err => {
          this.tabLoading = false;
          this.receipts = [];
          this.feedback.error('Receipts', extractApiError(err, 'Request failed').message);
        }
      });
    } else if (this.activeTab === 'years') {
      this.api.studentAcademicYears(this.selectedStudentId).subscribe({
        next: rows => { this.yearHistory = rows; this.tabLoading = false; },
        error: err => {
          this.tabLoading = false;
          this.yearHistory = [];
          this.feedback.error('Academic years', extractApiError(err, 'Request failed').message);
        }
      });
    } else {
      this.tabLoading = false;
    }
  }

  switchToYear(yearId: number): void {
    this.academicYearId = yearId;
    this.activeTab = 'overview';
    this.loadDetail();
    if (this.canSearch) this.search();
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

  downloadReceipt(row: FeeReceipt): void {
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
      advance: this.detail.kpis?.advance ?? 0,
      canCollectFee: this.detail.canCollectFee
    };
    this.collectVisible = true;
  }

  onCollected(): void {
    this.loadDetail();
    if (this.canSearch) this.search();
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
