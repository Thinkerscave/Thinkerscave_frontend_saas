import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-reports-dashboard',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, ChartModule, DropdownModule, FormsModule],
    template: `
    <div class="reports-dashboard">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-chart-bar"></i> Fee Reports & Analytics</h2>
          <p>Comprehensive fee management reporting and insights</p>
          <p class="preview-banner" role="status">
            <i class="pi pi-eye"></i>
            Preview only — sample figures, not live fee data. Live fee analytics are a Future Enhancement.
          </p>
        </div>
        <div class="header-actions">
          <p-dropdown [options]="periodOptions" [(ngModel)]="selectedPeriod" optionLabel="label" optionValue="value" (onChange)="onPeriodChange()"></p-dropdown>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon collected"><i class="pi pi-indian-rupee"></i></div>
          <div class="kpi-content">
            <span class="kpi-value">₹{{ totalCollected | number }}</span>
            <span class="kpi-label">Total Collected</span>
            <span class="kpi-trend up"><i class="pi pi-arrow-up"></i> 12% vs last month</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon pending"><i class="pi pi-clock"></i></div>
          <div class="kpi-content">
            <span class="kpi-value">₹{{ totalPending | number }}</span>
            <span class="kpi-label">Outstanding Dues</span>
            <span class="kpi-trend down"><i class="pi pi-arrow-down"></i> 5% reduction</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon rate"><i class="pi pi-percentage"></i></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ collectionRate }}%</span>
            <span class="kpi-label">Collection Rate</span>
            <span class="kpi-trend up"><i class="pi pi-arrow-up"></i> 3% improvement</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon students"><i class="pi pi-users"></i></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ defaultersCount }}</span>
            <span class="kpi-label">Defaulters</span>
            <span class="kpi-trend down"><i class="pi pi-arrow-down"></i> 8 cleared this week</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card large">
          <div class="chart-header">
            <h4>Collection Trend</h4>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot collected"></span> Collected</span>
              <span class="legend-item"><span class="dot due"></span> Due</span>
            </div>
          </div>
          <p-chart type="bar" [data]="collectionTrendData" [options]="barOptions" [style]="{height:'280px'}"></p-chart>
        </div>
        <div class="chart-card">
          <h4>Collection by Mode</h4>
          <p-chart type="doughnut" [data]="paymentModeData" [options]="doughnutOptions" [style]="{height:'200px'}"></p-chart>
          <div class="mode-stats">
            <div class="mode-item" *ngFor="let mode of paymentModeStats">
              <span class="mode-label">{{ mode.name }}</span>
              <span class="mode-value">₹{{ mode.amount | number }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Reports Grid -->
      <div class="section-header">
        <h3><i class="pi pi-file"></i> Quick Reports</h3>
      </div>
      <div class="reports-grid">
        <a routerLink="collection" class="report-card">
          <div class="report-icon collected"><i class="pi pi-indian-rupee"></i></div>
          <div class="report-content">
            <h4>Collection Report</h4>
            <p>Fee collection summary by period, class, and fee head</p>
            <span class="report-meta"><i class="pi pi-refresh"></i> Updated today</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </a>
        <a routerLink="outstanding" class="report-card">
          <div class="report-icon pending"><i class="pi pi-exclamation-circle"></i></div>
          <div class="report-content">
            <h4>Outstanding Report</h4>
            <p>Pending dues breakdown by class, section, and student</p>
            <span class="report-meta"><i class="pi pi-users"></i> {{ outstandingStudents }} students</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </a>
        <a routerLink="daily" class="report-card">
          <div class="report-icon daily"><i class="pi pi-calendar"></i></div>
          <div class="report-content">
            <h4>Daily Collection</h4>
            <p>Day-wise collection breakdown by collector and payment mode</p>
            <span class="report-meta"><i class="pi pi-clock"></i> Today: ₹{{ todayCollection | number }}</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </a>
        <a routerLink="defaulters" class="report-card">
          <div class="report-icon danger"><i class="pi pi-user-minus"></i></div>
          <div class="report-content">
            <h4>Defaulters Report</h4>
            <p>Students with overdue payments beyond threshold</p>
            <span class="report-meta warning"><i class="pi pi-exclamation-triangle"></i> {{ criticalDefaulters }} critical</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </a>
      </div>

      <!-- Recent Activity -->
      <div class="activity-section">
        <div class="section-header">
          <h3><i class="pi pi-history"></i> Recent Activity</h3>
          <button pButton label="View All" icon="pi pi-arrow-right" iconPos="right" class="p-button-text p-button-sm"></button>
        </div>
        <div class="activity-list">
          <div class="activity-item" *ngFor="let activity of recentActivities">
            <div class="activity-icon" [ngClass]="activity.type">
              <i [class]="activity.icon"></i>
            </div>
            <div class="activity-content">
              <span class="activity-title">{{ activity.title }}</span>
              <span class="activity-desc">{{ activity.description }}</span>
            </div>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .reports-dashboard { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .preview-banner {
      margin-top: 0.75rem !important;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      background: #fff8e6;
      color: #8a5a00 !important;
      border: 1px solid #f0d48a;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.875rem;
    }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .kpi-card { display: flex; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .kpi-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-icon.collected { background: #dcfce7; color: #16a34a; }
    .kpi-icon.pending { background: #fef3c7; color: #d97706; }
    .kpi-icon.rate { background: #dbeafe; color: #2563eb; }
    .kpi-icon.students { background: #fee2e2; color: #dc2626; }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; }
    .kpi-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .kpi-trend { font-size: 0.75rem; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.25rem; }
    .kpi-trend.up { color: #16a34a; }
    .kpi-trend.down { color: #16a34a; }

    .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .chart-card.large { }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .chart-card h4 { margin: 0 0 1rem; }
    .chart-legend { display: flex; gap: 1rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .legend-item .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.collected { background: #10b981; }
    .dot.due { background: #f59e0b; }
    .mode-stats { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
    .mode-item { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .mode-label { color: var(--text-color-secondary); }
    .mode-value { font-weight: 600; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }

    .reports-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .report-card { display: flex; align-items: center; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; text-decoration: none; color: inherit; border: 1px solid var(--surface-border); transition: all 0.2s; }
    .report-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: var(--primary-color); transform: translateY(-2px); }
    .report-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .report-icon.collected { background: #dcfce7; color: #16a34a; }
    .report-icon.pending { background: #fef3c7; color: #d97706; }
    .report-icon.daily { background: #dbeafe; color: #2563eb; }
    .report-icon.danger { background: #fee2e2; color: #dc2626; }
    .report-content { flex: 1; }
    .report-content h4 { margin: 0 0 0.25rem; font-size: 1rem; }
    .report-content p { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); }
    .report-meta { font-size: 0.75rem; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.25rem; margin-top: 0.5rem; }
    .report-meta.warning { color: #d97706; }
    .report-card > .pi-chevron-right { color: var(--text-color-secondary); }

    .activity-section { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .activity-list { display: flex; flex-direction: column; gap: 1rem; }
    .activity-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 8px; background: var(--surface-ground); }
    .activity-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .activity-icon.payment { background: #dcfce7; color: #16a34a; }
    .activity-icon.adjustment { background: #dbeafe; color: #2563eb; }
    .activity-icon.reminder { background: #fef3c7; color: #d97706; }
    .activity-content { flex: 1; display: flex; flex-direction: column; }
    .activity-title { font-weight: 500; font-size: 0.875rem; }
    .activity-desc { font-size: 0.75rem; color: var(--text-color-secondary); }
    .activity-time { font-size: 0.75rem; color: var(--text-color-secondary); }

    @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .charts-row { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .kpi-grid { grid-template-columns: 1fr; } .reports-grid { grid-template-columns: 1fr; } }
  `]
})
export class ReportsDashboardComponent implements OnInit {
    selectedPeriod = 'this_month';
    totalCollected = 4850000;
    totalPending = 1250000;
    collectionRate = 79.5;
    defaultersCount = 42;
    outstandingStudents = 156;
    todayCollection = 125000;
    criticalDefaulters = 12;

    periodOptions = [
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'This Quarter', value: 'this_quarter' },
        { label: 'This Year', value: 'this_year' }
    ];

    collectionTrendData: any;
    paymentModeData: any;
    barOptions: any;
    doughnutOptions: any;

    paymentModeStats = [
        { name: 'Online', amount: 2850000 },
        { name: 'Cash', amount: 1200000 },
        { name: 'Cheque', amount: 500000 },
        { name: 'Bank Transfer', amount: 300000 }
    ];

    recentActivities = [
        { type: 'payment', icon: 'pi pi-indian-rupee', title: 'Payment Received', description: 'Rahul Sharma - ₹12,000 - Class 10-A', time: '10 mins ago' },
        { type: 'adjustment', icon: 'pi pi-sync', title: 'Discount Applied', description: 'Sibling Discount - Amit Kumar - ₹5,000', time: '25 mins ago' },
        { type: 'reminder', icon: 'pi pi-bell', title: 'Reminder Sent', description: 'Bulk reminder to 15 defaulters', time: '1 hour ago' },
        { type: 'payment', icon: 'pi pi-indian-rupee', title: 'Payment Received', description: 'Priya Singh - ₹8,500 - Class 8-B', time: '2 hours ago' }
    ];

    ngOnInit(): void {
        this.initCharts();
    }

    initCharts(): void {
        this.collectionTrendData = {
            labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
            datasets: [
                {
                    label: 'Collected',
                    backgroundColor: '#10b981',
                    data: [420000, 450000, 480000, 520000, 490000, 510000, 550000, 520000, 600000, 485000]
                },
                {
                    label: 'Due',
                    backgroundColor: '#f59e0b',
                    data: [80000, 70000, 60000, 50000, 80000, 75000, 45000, 60000, 40000, 125000]
                }
            ]
        };

        this.paymentModeData = {
            labels: ['Online', 'Cash', 'Cheque', 'Bank Transfer'],
            datasets: [{
                data: [58, 25, 10, 7],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
            }]
        };

        this.barOptions = {
            plugins: { legend: { display: false } },
            scales: { x: { stacked: false }, y: { beginAtZero: true } },
            maintainAspectRatio: false
        };

        this.doughnutOptions = {
            plugins: { legend: { display: false } },
            cutout: '70%',
            maintainAspectRatio: false
        };
    }

    onPeriodChange(): void {
        // Refresh data based on period
    }
}
