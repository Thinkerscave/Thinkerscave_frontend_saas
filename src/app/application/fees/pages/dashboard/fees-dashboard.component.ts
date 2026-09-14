import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { environment } from '../../../../../environments/environment';
import { FeesApiService } from '../../services/fees-api.service';
import { CollectFeeDialogComponent } from '../../components/collect-fee-dialog/collect-fee-dialog.component';
import {
  CollectionTrendPoint,
  FEES_RESOURCES,
  FeeDashboardKpis,
  FeePayment,
  OutstandingItem,
  PaymentStatusSlice,
  StudentFeeListItem
} from '../../models/fees.model';

interface LookupOption { id: number; name: string; status?: string; }

@Component({
  selector: 'app-fees-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, HasPermissionDirective, AppToastComponent,
    CollectFeeDialogComponent, KpiCardComponent, KpiGroupComponent, SaasPageHeaderComponent,
    TcPageSkeletonComponent
  ],
  templateUrl: './fees-dashboard.component.html',
  styleUrls: ['./fees-dashboard.component.scss', '../../fees.shared.scss']
})
export class FeesDashboardComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly http = inject(HttpClient);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly resources = FEES_RESOURCES;
  years: LookupOption[] = [];
  academicYearId: number | null = null;
  kpis: FeeDashboardKpis | null = null;
  trend: CollectionTrendPoint[] = [];
  statusSlices: PaymentStatusSlice[] = [];
  recent: FeePayment[] = [];
  upcoming: OutstandingItem[] = [];
  loading = true;
  error: string | null = null;
  collectVisible = false;
  collectStudent: StudentFeeListItem | null = null;

  trendMax = 1;
  statusTotal = 1;

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/academic-years`)
      .pipe(map(r => r.data ?? []))
      .subscribe({
        next: years => {
          this.years = years;
          const current = years.find(y => String(y.status || '').toUpperCase() === 'CURRENT')
            ?? years.find(y => /2026-27/i.test(y.name))
            ?? years.find(y => !/preparing|2027/i.test(y.name));
          this.academicYearId = current?.id ?? years[0]?.id ?? null;
          this.load();
        },
        error: err => {
          this.loading = false;
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load academic years';
          this.cdr.detectChanges();
        }
      });
  }

  load(): void {
    if (this.academicYearId == null) {
      this.loading = false;
      return;
    }
    this.loading = !this.kpis;
    this.error = null;
    const yearId = this.academicYearId;

    forkJoin({
      kpis: this.api.dashboardKpis(yearId),
      trend: this.api.collectionTrend(yearId).pipe(catchError(() => of([] as CollectionTrendPoint[]))),
      status: this.api.paymentStatus(yearId).pipe(catchError(() => of([] as PaymentStatusSlice[]))),
      recent: this.api.recentCollections(0, 8).pipe(
        map(p => p.content),
        catchError(() => of([] as FeePayment[]))
      ),
      upcoming: this.api.upcomingDues(yearId).pipe(catchError(() => of([] as OutstandingItem[])))
    }).pipe(finalizeBusy(v => (this.loading = v))).subscribe({
      next: data => {
        this.kpis = data.kpis;
        this.trend = data.trend;
        this.statusSlices = data.status;
        this.recent = data.recent;
        this.upcoming = data.upcoming;
        this.trendMax = Math.max(
          1,
          ...this.trend.map(t => Math.max(Number(t.collected) || 0, Number(t.due) || 0))
        );
        this.statusTotal = Math.max(
          1,
          this.statusSlices.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
        );
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = extractApiError(err, 'Request failed').message || 'Failed to load fee dashboard';
        this.cdr.detectChanges();
      }
    });
  }

  onYearChange(): void {
    this.load();
  }

  openCollect(): void {
    this.collectStudent = null;
    this.collectVisible = true;
  }

  onCollected(): void {
    this.feedback.success('Updated', 'Dashboard refreshed.');
    this.load();
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  barHeight(value: number): number {
    return Math.max(4, Math.round((Number(value) || 0) / this.trendMax * 100));
  }

  statusWidth(amount: number): number {
    return Math.max(2, Math.round((Number(amount) || 0) / this.statusTotal * 100));
  }

  statusTone(status: string): string {
    switch (status) {
      case 'COLLECTED': return 'success';
      case 'OVERDUE': return 'danger';
      default: return 'warning';
    }
  }

  monthLabel(month: string): string {
    if (!month || month.length < 7) return month;
    const [y, m] = month.split('-');
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = Number(m) - 1;
    return `${names[idx] || m} ${y?.slice(2) || ''}`;
  }
}
