import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { TabViewModule } from 'primeng/tabview';
import { ChartModule } from 'primeng/chart';

interface LedgerEntry {
    id: string;
    date: Date;
    type: 'DEBIT' | 'CREDIT';
    description: string;
    reference: string;
    debit: number;
    credit: number;
    balance: number;
    category: string;
}

interface StudentInfo {
    id: string;
    name: string;
    admissionNo: string;
    className: string;
    section: string;
    fatherName: string;
    phone: string;
    email: string;
}

@Component({
    selector: 'app-student-ledger',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, TableModule,
        TagModule, DividerModule, CardModule, TimelineModule, TabViewModule, ChartModule
    ],
    template: `
    <div class="student-ledger">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-book"></i> Student Ledger</h2>
          <p>Complete financial history for student</p>
        </div>
        <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
      </div>

      <!-- Student Info Card -->
      <div class="student-info-card">
        <div class="student-avatar">
          <i class="pi pi-user"></i>
        </div>
        <div class="student-details">
          <h3>{{ student.name }}</h3>
          <div class="detail-row">
            <span><i class="pi pi-id-card"></i> {{ student.admissionNo }}</span>
            <span><i class="pi pi-building"></i> {{ student.className }} - {{ student.section }}</span>
            <span><i class="pi pi-user"></i> S/o {{ student.fatherName }}</span>
            <span><i class="pi pi-phone"></i> {{ student.phone }}</span>
          </div>
        </div>
        <div class="student-actions">
          <button pButton label="Print Statement" icon="pi pi-print" class="p-button-outlined"></button>
          <button pButton label="Download PDF" icon="pi pi-download" class="p-button-outlined"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon blue"><i class="pi pi-file"></i></div>
          <div class="summary-content">
            <span class="label">Total Fees</span>
            <span class="value">₹{{ totalFees | number }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon green"><i class="pi pi-check-circle"></i></div>
          <div class="summary-content">
            <span class="label">Total Paid</span>
            <span class="value success">₹{{ totalPaid | number }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon orange"><i class="pi pi-clock"></i></div>
          <div class="summary-content">
            <span class="label">Pending Dues</span>
            <span class="value warning">₹{{ pendingDues | number }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon red"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="summary-content">
            <span class="label">Overdue</span>
            <span class="value danger">₹{{ overdue | number }}</span>
          </div>
        </div>
      </div>

      <p-tabView>
        <!-- Ledger Tab -->
        <p-tabPanel header="Ledger">
          <div class="ledger-section">
            <div class="section-header">
              <h4>Transaction History</h4>
              <div class="filters">
                <select class="filter-select" [(ngModel)]="selectedYear">
                  <option value="">All Years</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </div>
            </div>

            <p-table [value]="ledgerEntries" styleClass="p-datatable-sm p-datatable-striped">
              <ng-template pTemplate="header">
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Debit (Dr)</th>
                  <th>Credit (Cr)</th>
                  <th>Balance</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-entry>
                <tr>
                  <td>{{ entry.date | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="entry-desc">
                      <span class="desc-text">{{ entry.description }}</span>
                      <p-tag [value]="entry.category" [severity]="getCategorySeverity(entry.category)" [style]="{'font-size':'0.7rem'}"></p-tag>
                    </div>
                  </td>
                  <td><code>{{ entry.reference }}</code></td>
                  <td class="debit">{{ entry.debit > 0 ? '₹' + (entry.debit | number) : '-' }}</td>
                  <td class="credit">{{ entry.credit > 0 ? '₹' + (entry.credit | number) : '-' }}</td>
                  <td class="balance">₹{{ entry.balance | number }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="footer">
                <tr class="totals-row">
                  <td colspan="3" class="text-right"><strong>Totals:</strong></td>
                  <td class="debit"><strong>₹{{ getTotalDebit() | number }}</strong></td>
                  <td class="credit"><strong>₹{{ getTotalCredit() | number }}</strong></td>
                  <td class="balance"><strong>₹{{ getCurrentBalance() | number }}</strong></td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <!-- Payments Tab -->
        <p-tabPanel header="Payments">
          <div class="payments-section">
            <h4>Payment History</h4>
            <div class="payment-timeline">
              <p-timeline [value]="payments" align="alternate">
                <ng-template pTemplate="content" let-payment>
                  <div class="payment-card">
                    <div class="payment-header">
                      <span class="amount">₹{{ payment.amount | number }}</span>
                      <p-tag [value]="payment.mode" severity="info"></p-tag>
                    </div>
                    <div class="payment-details">
                      <span class="receipt">{{ payment.receiptNo }}</span>
                      <span class="date">{{ payment.date | date:'dd MMM yyyy' }}</span>
                    </div>
                  </div>
                </ng-template>
                <ng-template pTemplate="opposite" let-payment>
                  <small class="text-muted">{{ payment.date | date:'dd MMM yyyy' }}</small>
                </ng-template>
              </p-timeline>
            </div>
          </div>
        </p-tabPanel>

        <!-- Installments Tab -->
        <p-tabPanel header="Installments">
          <div class="installments-section">
            <h4>Installment Schedule</h4>
            <p-table [value]="installments" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Installment</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-inst>
                <tr>
                  <td><strong>{{ inst.name }}</strong></td>
                  <td>{{ inst.dueDate | date:'dd/MM/yyyy' }}</td>
                  <td>₹{{ inst.amount | number }}</td>
                  <td class="credit">₹{{ inst.paid | number }}</td>
                  <td class="debit">₹{{ inst.amount - inst.paid | number }}</td>
                  <td><p-tag [value]="inst.status" [severity]="getStatusSeverity(inst.status)"></p-tag></td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <!-- Chart Tab -->
        <p-tabPanel header="Analytics">
          <div class="chart-section">
            <div class="chart-grid">
              <div class="chart-card">
                <h4>Payment Progress</h4>
                <p-chart type="doughnut" [data]="paymentChartData" [options]="chartOptions"></p-chart>
              </div>
              <div class="chart-card">
                <h4>Monthly Payments</h4>
                <p-chart type="bar" [data]="monthlyChartData" [options]="barChartOptions"></p-chart>
              </div>
            </div>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
    styles: [`
    .student-ledger { padding: 1.5rem; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }

    .student-info-card { display: flex; align-items: center; gap: 1.5rem; background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .student-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
    .student-details { flex: 1; }
    .student-details h3 { margin: 0 0 0.5rem; }
    .detail-row { display: flex; flex-wrap: wrap; gap: 1.5rem; color: var(--text-color-secondary); }
    .detail-row span { display: flex; align-items: center; gap: 0.5rem; }
    .student-actions { display: flex; gap: 0.5rem; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { display: flex; align-items: center; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .summary-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-icon.blue { background: #dbeafe; color: #2563eb; }
    .summary-icon.green { background: #d1fae5; color: #10b981; }
    .summary-icon.orange { background: #fef3c7; color: #f59e0b; }
    .summary-icon.red { background: #fee2e2; color: #ef4444; }
    .summary-content { display: flex; flex-direction: column; }
    .summary-content .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .summary-content .value { font-size: 1.5rem; font-weight: 700; }
    .summary-content .value.success { color: #10b981; }
    .summary-content .value.warning { color: #f59e0b; }
    .summary-content .value.danger { color: #ef4444; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h4 { margin: 0; }
    .filter-select { padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--surface-border); background: var(--surface-card); }

    .entry-desc { display: flex; flex-direction: column; gap: 0.25rem; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; }
    .debit { color: #ef4444; font-weight: 500; }
    .credit { color: #10b981; font-weight: 500; }
    .balance { font-weight: 600; }
    .text-right { text-align: right; }
    .totals-row { background: var(--surface-ground); }

    .payment-card { background: var(--surface-card); border-radius: 8px; padding: 1rem; border: 1px solid var(--surface-border); }
    .payment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .payment-header .amount { font-size: 1.25rem; font-weight: 700; color: #10b981; }
    .payment-details { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: var(--text-color-secondary); }

    .chart-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .chart-card { background: var(--surface-ground); border-radius: 12px; padding: 1.5rem; }
    .chart-card h4 { margin: 0 0 1rem; }

    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-grid { grid-template-columns: 1fr; }
      .student-info-card { flex-direction: column; text-align: center; }
      .student-actions { flex-direction: column; }
    }
  `]
})
export class StudentLedgerComponent implements OnInit {
    selectedYear = '';

    student: StudentInfo = {
        id: '1', name: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10',
        section: 'A', fatherName: 'Rajesh Sharma', phone: '9876543210', email: 'rahul@email.com'
    };

    totalFees = 72000;
    totalPaid = 36000;
    pendingDues = 36000;
    overdue = 18000;

    ledgerEntries: LedgerEntry[] = [];
    payments: any[] = [];
    installments: any[] = [];

    paymentChartData: any;
    monthlyChartData: any;
    chartOptions: any;
    barChartOptions: any;

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.loadLedgerEntries();
        this.loadPayments();
        this.loadInstallments();
        this.initCharts();
    }

    loadLedgerEntries(): void {
        this.ledgerEntries = [
            { id: '1', date: new Date('2025-04-01'), type: 'DEBIT', description: 'Fee Contract - Q1 2025-26', reference: 'FC-2025-0001', debit: 18000, credit: 0, balance: 18000, category: 'Fee' },
            { id: '2', date: new Date('2025-04-15'), type: 'CREDIT', description: 'Payment Received - Cash', reference: 'RCP-2025-0001', debit: 0, credit: 18000, balance: 0, category: 'Payment' },
            { id: '3', date: new Date('2025-07-01'), type: 'DEBIT', description: 'Fee Contract - Q2 2025-26', reference: 'FC-2025-0001', debit: 18000, credit: 0, balance: 18000, category: 'Fee' },
            { id: '4', date: new Date('2025-07-10'), type: 'CREDIT', description: 'Payment Received - UPI', reference: 'RCP-2025-0045', debit: 0, credit: 18000, balance: 0, category: 'Payment' },
            { id: '5', date: new Date('2025-10-01'), type: 'DEBIT', description: 'Fee Contract - Q3 2025-26', reference: 'FC-2025-0001', debit: 18000, credit: 0, balance: 18000, category: 'Fee' },
            { id: '6', date: new Date('2025-10-20'), type: 'DEBIT', description: 'Late Fee Applied', reference: 'LF-2025-0012', debit: 500, credit: 0, balance: 18500, category: 'Late Fee' },
            { id: '7', date: new Date('2026-01-01'), type: 'DEBIT', description: 'Fee Contract - Q4 2025-26', reference: 'FC-2025-0001', debit: 18000, credit: 0, balance: 36500, category: 'Fee' }
        ];
    }

    loadPayments(): void {
        this.payments = [
            { receiptNo: 'RCP-2025-0001', amount: 18000, date: new Date('2025-04-15'), mode: 'Cash' },
            { receiptNo: 'RCP-2025-0045', amount: 18000, date: new Date('2025-07-10'), mode: 'UPI' }
        ];
    }

    loadInstallments(): void {
        this.installments = [
            { name: 'Q1 - Apr to Jun', dueDate: new Date('2025-04-15'), amount: 18000, paid: 18000, status: 'PAID' },
            { name: 'Q2 - Jul to Sep', dueDate: new Date('2025-07-15'), amount: 18000, paid: 18000, status: 'PAID' },
            { name: 'Q3 - Oct to Dec', dueDate: new Date('2025-10-15'), amount: 18000, paid: 0, status: 'OVERDUE' },
            { name: 'Q4 - Jan to Mar', dueDate: new Date('2026-01-15'), amount: 18000, paid: 0, status: 'PENDING' }
        ];
    }

    initCharts(): void {
        this.paymentChartData = {
            labels: ['Paid', 'Pending'],
            datasets: [{ data: [this.totalPaid, this.pendingDues], backgroundColor: ['#10b981', '#f59e0b'] }]
        };

        this.monthlyChartData = {
            labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
            datasets: [{ label: 'Payments', data: [18000, 0, 0, 18000, 0, 0, 0, 0, 0, 0], backgroundColor: '#6366f1' }]
        };

        this.chartOptions = { plugins: { legend: { position: 'bottom' } } };
        this.barChartOptions = { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };
    }

    getTotalDebit(): number { return this.ledgerEntries.reduce((sum, e) => sum + e.debit, 0); }
    getTotalCredit(): number { return this.ledgerEntries.reduce((sum, e) => sum + e.credit, 0); }
    getCurrentBalance(): number { return this.getTotalDebit() - this.getTotalCredit(); }

    getCategorySeverity(cat: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = { 'Fee': 'info', 'Payment': 'success', 'Late Fee': 'danger', 'Adjustment': 'warn' };
        return map[cat] || 'info';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = { 'PAID': 'success', 'PENDING': 'warn', 'OVERDUE': 'danger' };
        return map[status] || 'info';
    }
}
