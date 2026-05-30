import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';

interface DashboardStats {
    totalCollection: number;
    todayCollection: number;
    outstandingAmount: number;
    overdueAmount: number;
    totalStudents: number;
    paidStudents: number;
    partiallyPaidStudents: number;
    unpaidStudents: number;
}

interface RecentPayment {
    receiptNumber: string;
    studentName: string;
    className: string;
    amount: number;
    paymentMode: string;
    date: Date;
}

@Component({
    selector: 'app-fee-dashboard',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        ChartModule,
        TableModule,
        TagModule,
        ProgressBarModule,
        TooltipModule
    ],
    template: `
    <div class="fee-dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1><i class="pi pi-wallet"></i> Fee Dashboard</h1>
          <p class="subtitle">Real-time overview of fee collection and outstanding dues</p>
        </div>
        <div class="header-actions">
          <button pButton label="Collect Payment" icon="pi pi-plus" 
                  class="p-button-success" routerLink="/app/fees/payments"></button>
          <button pButton label="Generate Report" icon="pi pi-file-pdf" 
                  class="p-button-outlined" routerLink="/app/fees/reports"></button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card total-collection">
          <div class="stat-icon">
            <i class="pi pi-indian-rupee"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Collection</span>
            <span class="stat-value">₹{{ formatAmount(stats.totalCollection) }}</span>
            <span class="stat-period">This Academic Year</span>
          </div>
        </div>

        <div class="stat-card today-collection">
          <div class="stat-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Today's Collection</span>
            <span class="stat-value">₹{{ formatAmount(stats.todayCollection) }}</span>
            <span class="stat-period">{{ today | date:'mediumDate' }}</span>
          </div>
        </div>

        <div class="stat-card outstanding">
          <div class="stat-icon">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Outstanding Amount</span>
            <span class="stat-value">₹{{ formatAmount(stats.outstandingAmount) }}</span>
            <span class="stat-period">Pending Collection</span>
          </div>
        </div>

        <div class="stat-card overdue">
          <div class="stat-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Overdue Amount</span>
            <span class="stat-value danger">₹{{ formatAmount(stats.overdueAmount) }}</span>
            <span class="stat-period">Past Due Date</span>
          </div>
        </div>
      </div>

      <!-- Quick Navigation -->
      <div class="quick-nav-section">
        <h3><i class="pi pi-th-large"></i> Quick Actions</h3>
        <div class="quick-nav-grid">
          <a routerLink="/app/fees/setup" class="quick-nav-card setup">
            <i class="pi pi-cog"></i>
            <span>Fee Setup</span>
            <small>Configure fee heads & structure</small>
          </a>
          <a routerLink="/app/fees/contracts" class="quick-nav-card contracts">
            <i class="pi pi-file"></i>
            <span>Contracts</span>
            <small>Manage student contracts</small>
          </a>
          <a routerLink="/app/fees/payments" class="quick-nav-card payments">
            <i class="pi pi-credit-card"></i>
            <span>Payments</span>
            <small>Collect & track payments</small>
          </a>
          <a routerLink="/app/fees/receipts" class="quick-nav-card receipts">
            <i class="pi pi-receipt"></i>
            <span>Receipts</span>
            <small>View & print receipts</small>
          </a>
          <a routerLink="/app/fees/adjustments" class="quick-nav-card adjustments">
            <i class="pi pi-percentage"></i>
            <span>Adjustments</span>
            <small>Discounts & waivers</small>
          </a>
          <a routerLink="/app/fees/reports" class="quick-nav-card reports">
            <i class="pi pi-chart-bar"></i>
            <span>Reports</span>
            <small>Analytics & reports</small>
          </a>
        </div>
      </div>

      <!-- Student Payment Status -->
      <div class="status-section">
        <div class="section-header">
          <h3><i class="pi pi-users"></i> Student Payment Status</h3>
        </div>
        <div class="status-cards">
          <div class="status-card paid">
            <div class="status-count">{{ stats.paidStudents }}</div>
            <div class="status-label">Fully Paid</div>
            <div class="status-progress">
              <p-progressBar [value]="getPaidPercentage()" [showValue]="false" 
                            styleClass="paid-progress"></p-progressBar>
            </div>
          </div>
          <div class="status-card partial">
            <div class="status-count">{{ stats.partiallyPaidStudents }}</div>
            <div class="status-label">Partially Paid</div>
            <div class="status-progress">
              <p-progressBar [value]="getPartialPercentage()" [showValue]="false"
                            styleClass="partial-progress"></p-progressBar>
            </div>
          </div>
          <div class="status-card unpaid">
            <div class="status-count">{{ stats.unpaidStudents }}</div>
            <div class="status-label">Unpaid</div>
            <div class="status-progress">
              <p-progressBar [value]="getUnpaidPercentage()" [showValue]="false"
                            styleClass="unpaid-progress"></p-progressBar>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Payments Table -->
      <div class="recent-payments-section">
        <div class="section-header">
          <h3><i class="pi pi-history"></i> Recent Payments</h3>
          <a routerLink="/app/fees/payments/history" class="view-all-link">
            View All <i class="pi pi-arrow-right"></i>
          </a>
        </div>
        <p-table [value]="recentPayments" [rows]="5" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Receipt #</th>
              <th>Student</th>
              <th>Class</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Date</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-payment>
            <tr>
              <td><span class="receipt-number">{{ payment.receiptNumber }}</span></td>
              <td>{{ payment.studentName }}</td>
              <td>{{ payment.className }}</td>
              <td class="amount-cell">₹{{ formatAmount(payment.amount) }}</td>
              <td>
                <p-tag [value]="payment.paymentMode" 
                       [severity]="getPaymentModeSeverity(payment.paymentMode)"></p-tag>
              </td>
              <td>{{ payment.date | date:'short' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <p>No recent payments</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- System Info Notice -->
      <div class="system-notice">
        <i class="pi pi-info-circle"></i>
        <div class="notice-content">
          <strong>Read-Only Dashboard</strong>
          <p>This dashboard provides a real-time snapshot of fee collection status. 
             All data is fetched from immutable ledger entries and cannot be edited from this screen.</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .fee-dashboard {
      padding: 1.5rem;
      background: var(--surface-ground);
      min-height: calc(100vh - 120px);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-content h1 i {
      color: var(--primary-color);
    }

    .subtitle {
      margin: 0.5rem 0 0;
      color: var(--text-color-secondary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-left: 4px solid transparent;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .stat-card.total-collection { border-left-color: #10b981; }
    .stat-card.today-collection { border-left-color: #3b82f6; }
    .stat-card.outstanding { border-left-color: #f59e0b; }
    .stat-card.overdue { border-left-color: #ef4444; }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .total-collection .stat-icon { background: #d1fae5; color: #10b981; }
    .today-collection .stat-icon { background: #dbeafe; color: #3b82f6; }
    .outstanding .stat-icon { background: #fef3c7; color: #f59e0b; }
    .overdue .stat-icon { background: #fee2e2; color: #ef4444; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0.25rem 0;
    }

    .stat-value.danger { color: #ef4444; }

    .stat-period {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Quick Navigation */
    .quick-nav-section {
      margin-bottom: 2rem;
    }

    .quick-nav-section h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: var(--text-color);
    }

    .quick-nav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .quick-nav-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.25rem;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
      transition: all 0.2s;
      border: 1px solid var(--surface-border);
    }

    .quick-nav-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: var(--primary-color);
    }

    .quick-nav-card i {
      font-size: 2rem;
      padding: 1rem;
      border-radius: 50%;
    }

    .quick-nav-card.setup i { background: #ede9fe; color: #8b5cf6; }
    .quick-nav-card.contracts i { background: #dbeafe; color: #3b82f6; }
    .quick-nav-card.payments i { background: #d1fae5; color: #10b981; }
    .quick-nav-card.receipts i { background: #fef3c7; color: #f59e0b; }
    .quick-nav-card.adjustments i { background: #fce7f3; color: #ec4899; }
    .quick-nav-card.reports i { background: #e0e7ff; color: #6366f1; }

    .quick-nav-card span {
      font-weight: 600;
      color: var(--text-color);
    }

    .quick-nav-card small {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Status Section */
    .status-section {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .view-all-link {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .status-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .status-card {
      padding: 1.25rem;
      border-radius: 8px;
      text-align: center;
    }

    .status-card.paid { background: #d1fae5; }
    .status-card.partial { background: #fef3c7; }
    .status-card.unpaid { background: #fee2e2; }

    .status-count {
      font-size: 2rem;
      font-weight: 700;
    }

    .paid .status-count { color: #10b981; }
    .partial .status-count { color: #f59e0b; }
    .unpaid .status-count { color: #ef4444; }

    .status-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0.25rem 0 0.75rem;
    }

    /* Recent Payments */
    .recent-payments-section {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .receipt-number {
      font-family: monospace;
      font-weight: 600;
      color: var(--primary-color);
    }

    .amount-cell {
      font-weight: 600;
      color: #10b981;
    }

    .empty-state {
      padding: 2rem;
      color: var(--text-color-secondary);
    }

    .empty-state i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    /* System Notice */
    .system-notice {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #eff6ff;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .system-notice i {
      color: #3b82f6;
      font-size: 1.25rem;
      margin-top: 0.25rem;
    }

    .notice-content strong {
      color: #1e40af;
    }

    .notice-content p {
      margin: 0.25rem 0 0;
      color: #3b82f6;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }

      .status-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FeeDashboardComponent implements OnInit {
    today = new Date();

    stats: DashboardStats = {
        totalCollection: 2845000,
        todayCollection: 45600,
        outstandingAmount: 1250000,
        overdueAmount: 320000,
        totalStudents: 450,
        paidStudents: 285,
        partiallyPaidStudents: 98,
        unpaidStudents: 67
    };

    recentPayments: RecentPayment[] = [
        { receiptNumber: 'RCP-2026-0142', studentName: 'Rahul Sharma', className: 'Class 10-A', amount: 15000, paymentMode: 'UPI', date: new Date() },
        { receiptNumber: 'RCP-2026-0141', studentName: 'Priya Patel', className: 'Class 8-B', amount: 12500, paymentMode: 'Cash', date: new Date() },
        { receiptNumber: 'RCP-2026-0140', studentName: 'Amit Kumar', className: 'Class 12-A', amount: 18000, paymentMode: 'Card', date: new Date() },
        { receiptNumber: 'RCP-2026-0139', studentName: 'Sneha Gupta', className: 'Class 9-C', amount: 14000, paymentMode: 'Bank', date: new Date() },
        { receiptNumber: 'RCP-2026-0138', studentName: 'Vikram Singh', className: 'Class 11-B', amount: 16500, paymentMode: 'UPI', date: new Date() }
    ];

    ngOnInit(): void {
        // TODO: Load real data from API
    }

    formatAmount(amount: number): string {
        return amount.toLocaleString('en-IN');
    }

    getPaidPercentage(): number {
        return (this.stats.paidStudents / this.stats.totalStudents) * 100;
    }

    getPartialPercentage(): number {
        return (this.stats.partiallyPaidStudents / this.stats.totalStudents) * 100;
    }

    getUnpaidPercentage(): number {
        return (this.stats.unpaidStudents / this.stats.totalStudents) * 100;
    }

    getPaymentModeSeverity(mode: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        const severityMap: Record<string, 'success' | 'info' | 'warn' | 'secondary'> = {
            'UPI': 'success',
            'Cash': 'info',
            'Card': 'warn',
            'Bank': 'secondary'
        };
        return severityMap[mode] || 'info';
    }
}
