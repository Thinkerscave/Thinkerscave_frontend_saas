import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import { FeesApiService } from '../../services/fees-api.service';
import { CollectFeeDialogComponent } from '../../components/collect-fee-dialog/collect-fee-dialog.component';
import {
  CollectionTrendPoint,
  FEES_RESOURCES,
  FeeDashboardKpis,
  FeePayment,
  OutstandingItem,
  StudentFeeListItem
} from '../../models/fees.model';

interface FeesNavCard {
  title: string;
  subtitle: string;
  route: string;
  icon: string;
  tone: 'blue' | 'violet' | 'teal' | 'amber' | 'rose' | 'slate' | 'green';
}

@Component({
  selector: 'app-fees-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, HasPermissionDirective, AppToastComponent,
    CollectFeeDialogComponent, KpiCardComponent, KpiGroupComponent, SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './fees-dashboard.component.html',
  styleUrls: ['./fees-dashboard.component.scss', '../../fees.shared.scss']
})
export class FeesDashboardComponent {
  private readonly api = inject(FeesApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly resources = FEES_RESOURCES;
  readonly navCards: FeesNavCard[] = [
    { title: 'Fee Heads', subtitle: 'Tuition, transport, exam & more', route: '/app/fees/heads', icon: 'pi pi-database', tone: 'blue' },
    { title: 'Fee Structures', subtitle: 'Class-wise fee policies', route: '/app/fees/structures', icon: 'pi pi-sitemap', tone: 'violet' },
    { title: 'Student Fee', subtitle: 'Ledgers & payment history', route: '/app/fees/students', icon: 'pi pi-users', tone: 'teal' },
    { title: 'Outstanding', subtitle: 'Pending and overdue dues', route: '/app/fees/outstanding', icon: 'pi pi-clock', tone: 'amber' },
    { title: 'Receipts', subtitle: 'Immutable payment proofs', route: '/app/fees/receipts', icon: 'pi pi-receipt', tone: 'green' },
    { title: 'Reports', subtitle: 'Finance overview & exports', route: '/app/fees/reports', icon: 'pi pi-chart-bar', tone: 'rose' },
    { title: 'Settings', subtitle: 'Generation & payment methods', route: '/app/fees/settings', icon: 'pi pi-cog', tone: 'slate' }
  ];

  academicYearId: number | null = null;
  kpis: FeeDashboardKpis | null = null;
  trend: CollectionTrendPoint[] = [];
  recent: FeePayment[] = [];
  upcoming: OutstandingItem[] = [];
  loading = true;
  error: string | null = null;
  collectVisible = false;
  collectStudent: StudentFeeListItem | null = null;

  trendMax = 1;

  get collectionRate(): number {
    const generated = Number(this.kpis?.generated ?? 0);
    const collected = Number(this.kpis?.collected ?? 0);
    if (generated <= 0) return 0;
    return Math.min(100, Math.round((collected / generated) * 100));
  }

  get hasOverdue(): boolean {
    return Number(this.kpis?.overdue ?? 0) > 0;
  }

  get attentionAmount(): string {
    if (this.hasOverdue) {
      return this.formatMoney(this.kpis?.overdue);
    }
    return String(this.upcoming.length || '—');
  }

  get attentionLabel(): string {
    return this.hasOverdue ? 'Overdue balances waiting follow-up' : 'Open dues in the pipeline below';
  }

  get attentionValueLabel(): string {
    return this.hasOverdue ? 'Needs attention' : 'Open dues listed';
  }

  onAcademicYearChange(yearId: number | null): void {
    this.academicYearId = yearId;
    if (yearId == null) {
      this.kpis = null;
      this.trend = [];
      this.recent = [];
      this.upcoming = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    this.kpis = null;
    this.trend = [];
    this.recent = [];
    this.upcoming = [];
    this.loading = true;
    this.cdr.detectChanges();
    this.load();
  }

  load(): void {
    if (this.academicYearId == null) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = null;
    const yearId = this.academicYearId;

    forkJoin({
      kpis: this.api.dashboardKpis(yearId),
      trend: this.api.collectionTrend(yearId).pipe(catchError(() => of([] as CollectionTrendPoint[]))),
      recent: this.api.recentCollections(0, 8).pipe(
        map(p => p.content),
        catchError(() => of([] as FeePayment[]))
      ),
      upcoming: this.api.upcomingDues(yearId).pipe(catchError(() => of([] as OutstandingItem[])))
    }).pipe(finalizeBusy(v => (this.loading = v))).subscribe({
      next: data => {
        this.kpis = data.kpis;
        this.trend = data.trend;
        this.recent = data.recent;
        this.upcoming = data.upcoming;
        this.trendMax = Math.max(
          1,
          ...this.trend.map(t => Math.max(Number(t.collected) || 0, Number(t.due) || 0))
        );
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = extractApiError(err, 'Request failed').message || 'Failed to load fee dashboard';
        this.cdr.detectChanges();
      }
    });
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

  statusTone(status: string): string {
    switch (status) {
      case 'PAID':
      case 'COLLECTED':
        return 'success';
      case 'OVERDUE':
        return 'danger';
      case 'PARTIALLY_PAID':
        return 'warning';
      default:
        return 'warning';
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
