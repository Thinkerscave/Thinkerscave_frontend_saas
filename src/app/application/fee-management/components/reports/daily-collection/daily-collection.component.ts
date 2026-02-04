import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';

interface DailyTransaction {
    id: string;
    receiptNo: string;
    time: string;
    studentName: string;
    admissionNo: string;
    className: string;
    amount: number;
    paymentMode: string;
    collectedBy: string;
    feeHeads: string[];
}

interface HourlySummary {
    hour: string;
    transactions: number;
    amount: number;
}

interface CollectorSummary {
    name: string;
    transactions: number;
    amount: number;
    percentage: number;
}

@Component({
    selector: 'app-daily-collection',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, CalendarModule, DropdownModule, TagModule, ChartModule, TooltipModule],
    template: `
    <div class="daily-collection">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-calendar"></i> Daily Collection Report</h2>
          <p>Day-wise collection breakdown and analysis</p>
        </div>
        <div class="header-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
          <button pButton label="Export" icon="pi pi-download" class="p-button-outlined" (click)="exportReport()"></button>
          <button pButton label="Print" icon="pi pi-print" (click)="printReport()"></button>
        </div>
      </div>

      <!-- Date Selector -->
      <div class="date-selector">
        <button pButton icon="pi pi-chevron-left" class="p-button-text" (click)="previousDay()"></button>
        <p-calendar [(ngModel)]="selectedDate" dateFormat="dd MM yy" [showIcon]="true" (onSelect)="loadDayData()"></p-calendar>
        <button pButton icon="pi pi-chevron-right" class="p-button-text" (click)="nextDay()" [disabled]="isToday()"></button>
        <button pButton label="Today" class="p-button-text" (click)="goToToday()" *ngIf="!isToday()"></button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card total">
          <div class="summary-content">
            <span class="summary-label">Total Collection</span>
            <span class="summary-value">₹{{ totalCollection | number }}</span>
          </div>
          <div class="summary-icon"><i class="pi pi-indian-rupee"></i></div>
        </div>
        <div class="summary-card transactions">
          <div class="summary-content">
            <span class="summary-label">Transactions</span>
            <span class="summary-value">{{ totalTransactions }}</span>
          </div>
          <div class="summary-icon"><i class="pi pi-receipt"></i></div>
        </div>
        <div class="summary-card average">
          <div class="summary-content">
            <span class="summary-label">Average Transaction</span>
            <span class="summary-value">₹{{ avgTransaction | number }}</span>
          </div>
          <div class="summary-icon"><i class="pi pi-chart-bar"></i></div>
        </div>
        <div class="summary-card comparison">
          <div class="summary-content">
            <span class="summary-label">vs Yesterday</span>
            <span class="summary-value" [class.positive]="comparisonPercent > 0" [class.negative]="comparisonPercent < 0">
              {{ comparisonPercent > 0 ? '+' : '' }}{{ comparisonPercent }}%
            </span>
          </div>
          <div class="summary-icon"><i class="pi pi-chart-line"></i></div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card">
          <h4>Hourly Collection</h4>
          <p-chart type="bar" [data]="hourlyChartData" [options]="barOptions" [style]="{height:'220px'}"></p-chart>
        </div>
        <div class="chart-card">
          <h4>Payment Mode Distribution</h4>
          <p-chart type="doughnut" [data]="paymentModeData" [options]="doughnutOptions" [style]="{height:'180px'}"></p-chart>
          <div class="mode-legend">
            <div class="legend-item" *ngFor="let mode of paymentModeStats">
              <span class="mode-name">{{ mode.name }}</span>
              <span class="mode-value">₹{{ mode.amount | number }} ({{ mode.count }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Collector Summary -->
      <div class="content-card">
        <h3><i class="pi pi-users"></i> Collection by Staff</h3>
        <div class="collector-grid">
          <div class="collector-card" *ngFor="let collector of collectorSummary">
            <div class="collector-info">
              <div class="collector-avatar">{{ collector.name.charAt(0) }}</div>
              <div class="collector-details">
                <strong>{{ collector.name }}</strong>
                <small>{{ collector.transactions }} transactions</small>
              </div>
            </div>
            <div class="collector-amount">
              <span>₹{{ collector.amount | number }}</span>
              <div class="collector-bar" [style.width.%]="collector.percentage"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="content-card">
        <div class="table-header">
          <h3><i class="pi pi-list"></i> All Transactions</h3>
          <div class="table-filters">
            <p-dropdown [options]="paymentModeOptions" [(ngModel)]="selectedMode" placeholder="All Modes" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterTransactions()"></p-dropdown>
            <p-dropdown [options]="collectorOptions" [(ngModel)]="selectedCollector" placeholder="All Collectors" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterTransactions()"></p-dropdown>
          </div>
        </div>

        <p-table [value]="filteredTransactions" [paginator]="true" [rows]="15" styleClass="p-datatable-striped" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th>Time</th>
              <th>Receipt #</th>
              <th>Student</th>
              <th>Class</th>
              <th>Fee Heads</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Collected By</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-txn>
            <tr>
              <td><strong>{{ txn.time }}</strong></td>
              <td><code>{{ txn.receiptNo }}</code></td>
              <td>
                <div class="student-info">
                  <span>{{ txn.studentName }}</span>
                  <small>{{ txn.admissionNo }}</small>
                </div>
              </td>
              <td>{{ txn.className }}</td>
              <td>
                <div class="fee-tags">
                  <p-tag *ngFor="let fee of txn.feeHeads.slice(0, 2)" [value]="fee" severity="info" [style]="{'font-size':'0.7rem'}"></p-tag>
                  <span *ngIf="txn.feeHeads.length > 2" class="more-badge">+{{ txn.feeHeads.length - 2 }}</span>
                </div>
              </td>
              <td class="amount-cell">₹{{ txn.amount | number }}</td>
              <td><p-tag [value]="txn.paymentMode" [severity]="getModeSeverity(txn.paymentMode)"></p-tag></td>
              <td>{{ txn.collectedBy }}</td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Receipt"></button>
                <button pButton icon="pi pi-print" class="p-button-text p-button-sm" pTooltip="Print"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr class="footer-row">
              <td colspan="5"><strong>Total</strong></td>
              <td class="amount-cell"><strong>₹{{ totalCollection | number }}</strong></td>
              <td colspan="3"></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9" class="text-center p-4">No transactions for this date</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Hourly Breakdown -->
      <div class="content-card">
        <h3><i class="pi pi-clock"></i> Hourly Breakdown</h3>
        <div class="hourly-grid">
          <div class="hourly-item" *ngFor="let hour of hourlySummary" [class.active]="hour.transactions > 0">
            <span class="hour-label">{{ hour.hour }}</span>
            <span class="hour-count">{{ hour.transactions }} txn</span>
            <span class="hour-amount">₹{{ hour.amount | number }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .daily-collection { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .date-selector { display: flex; align-items: center; gap: 0.5rem; background: var(--surface-card); padding: 0.75rem 1rem; border-radius: 12px; margin-bottom: 1.5rem; width: fit-content; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { display: flex; justify-content: space-between; align-items: center; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .summary-content { display: flex; flex-direction: column; }
    .summary-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .summary-value { font-size: 1.75rem; font-weight: 700; }
    .summary-value.positive { color: #16a34a; }
    .summary-value.negative { color: #dc2626; }
    .summary-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-card.total .summary-icon { background: #dcfce7; color: #16a34a; }
    .summary-card.transactions .summary-icon { background: #dbeafe; color: #2563eb; }
    .summary-card.average .summary-icon { background: #f3e8ff; color: #9333ea; }
    .summary-card.comparison .summary-icon { background: #fef3c7; color: #d97706; }

    .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .chart-card h4 { margin: 0 0 1rem; }
    .mode-legend { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
    .legend-item { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .mode-name { color: var(--text-color-secondary); }
    .mode-value { font-weight: 500; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .content-card h3 { margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .table-header h3 { margin: 0; }
    .table-filters { display: flex; gap: 0.75rem; }

    .collector-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .collector-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .collector-info { display: flex; align-items: center; gap: 0.75rem; }
    .collector-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .collector-details { display: flex; flex-direction: column; }
    .collector-details small { color: var(--text-color-secondary); font-size: 0.75rem; }
    .collector-amount { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .collector-amount span { font-weight: 600; }
    .collector-bar { height: 4px; background: var(--primary-color); border-radius: 2px; min-width: 20px; }

    .student-info { display: flex; flex-direction: column; }
    .student-info small { color: var(--text-color-secondary); font-size: 0.75rem; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    .fee-tags { display: flex; gap: 0.25rem; align-items: center; }
    .more-badge { font-size: 0.7rem; background: var(--surface-ground); padding: 0.2rem 0.4rem; border-radius: 4px; }
    .amount-cell { font-weight: 600; color: #16a34a; }
    .footer-row { background: var(--surface-ground); }
    .text-center { text-align: center; }

    .hourly-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 0.5rem; }
    .hourly-item { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 0.5rem; background: var(--surface-ground); border-radius: 8px; font-size: 0.75rem; }
    .hourly-item.active { background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; }
    .hour-label { font-weight: 600; margin-bottom: 0.25rem; }
    .hour-count { color: var(--text-color-secondary); }
    .hour-amount { font-weight: 500; color: #16a34a; }

    @media (max-width: 1024px) { .collector-grid { grid-template-columns: repeat(2, 1fr); } .hourly-grid { grid-template-columns: repeat(6, 1fr); } }
    @media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } .charts-row { grid-template-columns: 1fr; } .collector-grid { grid-template-columns: 1fr; } .hourly-grid { grid-template-columns: repeat(4, 1fr); } }
  `]
})
export class DailyCollectionComponent implements OnInit {
    selectedDate: Date = new Date();
    selectedMode = '';
    selectedCollector = '';

    totalCollection = 125000;
    totalTransactions = 18;
    avgTransaction = 6944;
    comparisonPercent = 15;

    paymentModeOptions = [
        { label: 'Cash', value: 'Cash' },
        { label: 'Online', value: 'Online' },
        { label: 'Cheque', value: 'Cheque' },
        { label: 'Bank Transfer', value: 'Bank Transfer' }
    ];

    collectorOptions = [
        { label: 'Ramesh Kumar', value: 'Ramesh Kumar' },
        { label: 'Sunita Sharma', value: 'Sunita Sharma' },
        { label: 'Mohan Singh', value: 'Mohan Singh' }
    ];

    transactions: DailyTransaction[] = [];
    filteredTransactions: DailyTransaction[] = [];
    hourlySummary: HourlySummary[] = [];
    collectorSummary: CollectorSummary[] = [];
    paymentModeStats: { name: string; amount: number; count: number }[] = [];

    hourlyChartData: any;
    paymentModeData: any;
    barOptions: any;
    doughnutOptions: any;

    ngOnInit(): void {
        this.loadDayData();
        this.initCharts();
    }

    loadDayData(): void {
        this.transactions = [
            { id: '1', receiptNo: 'RCP-2026-0145', time: '09:15', studentName: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10-A', amount: 12000, paymentMode: 'Online', collectedBy: 'Ramesh Kumar', feeHeads: ['Tuition', 'Lab'] },
            { id: '2', receiptNo: 'RCP-2026-0146', time: '09:42', studentName: 'Priya Singh', admissionNo: 'ADM2024005', className: 'Class 8-B', amount: 8500, paymentMode: 'Cash', collectedBy: 'Sunita Sharma', feeHeads: ['Tuition'] },
            { id: '3', receiptNo: 'RCP-2026-0147', time: '10:05', studentName: 'Amit Kumar', admissionNo: 'ADM2024003', className: 'Class 12-A', amount: 15000, paymentMode: 'Online', collectedBy: 'Ramesh Kumar', feeHeads: ['Tuition', 'Lab', 'Library'] },
            { id: '4', receiptNo: 'RCP-2026-0148', time: '10:30', studentName: 'Neha Gupta', admissionNo: 'ADM2024015', className: 'Class 5-A', amount: 6000, paymentMode: 'Cash', collectedBy: 'Mohan Singh', feeHeads: ['Tuition'] },
            { id: '5', receiptNo: 'RCP-2026-0149', time: '11:15', studentName: 'Vikash Yadav', admissionNo: 'ADM2024018', className: 'Class 12-B', amount: 18000, paymentMode: 'Cheque', collectedBy: 'Ramesh Kumar', feeHeads: ['Tuition', 'Transport'] },
            { id: '6', receiptNo: 'RCP-2026-0150', time: '11:45', studentName: 'Kavita Singh', admissionNo: 'ADM2024010', className: 'Class 10-B', amount: 9500, paymentMode: 'Online', collectedBy: 'Sunita Sharma', feeHeads: ['Tuition'] },
            { id: '7', receiptNo: 'RCP-2026-0151', time: '12:20', studentName: 'Rohan Mehta', admissionNo: 'ADM2024007', className: 'Class 8-B', amount: 7500, paymentMode: 'Cash', collectedBy: 'Mohan Singh', feeHeads: ['Tuition'] },
            { id: '8', receiptNo: 'RCP-2026-0152', time: '14:10', studentName: 'Anita Verma', admissionNo: 'ADM2024022', className: 'Class 8-A', amount: 11000, paymentMode: 'Bank Transfer', collectedBy: 'Ramesh Kumar', feeHeads: ['Tuition', 'Sports'] },
            { id: '9', receiptNo: 'RCP-2026-0153', time: '14:45', studentName: 'Suresh Patel', admissionNo: 'ADM2024028', className: 'Class 5-B', amount: 5500, paymentMode: 'Cash', collectedBy: 'Sunita Sharma', feeHeads: ['Tuition'] },
            { id: '10', receiptNo: 'RCP-2026-0154', time: '15:30', studentName: 'Deepak Joshi', admissionNo: 'ADM2024035', className: 'Class 10-A', amount: 13000, paymentMode: 'Online', collectedBy: 'Ramesh Kumar', feeHeads: ['Tuition', 'Lab'] }
        ];
        this.filteredTransactions = [...this.transactions];

        this.collectorSummary = [
            { name: 'Ramesh Kumar', transactions: 5, amount: 69000, percentage: 55 },
            { name: 'Sunita Sharma', transactions: 3, amount: 23500, percentage: 19 },
            { name: 'Mohan Singh', transactions: 2, amount: 13500, percentage: 11 }
        ];

        this.paymentModeStats = [
            { name: 'Online', amount: 49500, count: 4 },
            { name: 'Cash', amount: 27500, count: 4 },
            { name: 'Cheque', amount: 18000, count: 1 },
            { name: 'Bank Transfer', amount: 11000, count: 1 }
        ];

        this.hourlySummary = [
            { hour: '9 AM', transactions: 2, amount: 20500 },
            { hour: '10 AM', transactions: 2, amount: 21000 },
            { hour: '11 AM', transactions: 2, amount: 27500 },
            { hour: '12 PM', transactions: 1, amount: 7500 },
            { hour: '1 PM', transactions: 0, amount: 0 },
            { hour: '2 PM', transactions: 2, amount: 16500 },
            { hour: '3 PM', transactions: 1, amount: 13000 },
            { hour: '4 PM', transactions: 0, amount: 0 },
            { hour: '5 PM', transactions: 0, amount: 0 },
            { hour: '6 PM', transactions: 0, amount: 0 },
            { hour: '7 PM', transactions: 0, amount: 0 },
            { hour: '8 PM', transactions: 0, amount: 0 }
        ];
    }

    initCharts(): void {
        this.hourlyChartData = {
            labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'],
            datasets: [{
                label: 'Collection',
                backgroundColor: '#3b82f6',
                data: [20500, 21000, 27500, 7500, 0, 16500, 13000, 0, 0]
            }]
        };

        this.paymentModeData = {
            labels: ['Online', 'Cash', 'Cheque', 'Bank Transfer'],
            datasets: [{
                data: [49500, 27500, 18000, 11000],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
            }]
        };

        this.barOptions = {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
            maintainAspectRatio: false
        };

        this.doughnutOptions = {
            plugins: { legend: { display: false } },
            cutout: '65%',
            maintainAspectRatio: false
        };
    }

    filterTransactions(): void {
        this.filteredTransactions = this.transactions.filter(txn => {
            const matchMode = !this.selectedMode || txn.paymentMode === this.selectedMode;
            const matchCollector = !this.selectedCollector || txn.collectedBy === this.selectedCollector;
            return matchMode && matchCollector;
        });
    }

    getModeSeverity(mode: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            'Online': 'info',
            'Cash': 'success',
            'Cheque': 'warn',
            'Bank Transfer': 'danger'
        };
        return map[mode] || 'info';
    }

    previousDay(): void {
        const newDate = new Date(this.selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        this.selectedDate = newDate;
        this.loadDayData();
    }

    nextDay(): void {
        const newDate = new Date(this.selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        this.selectedDate = newDate;
        this.loadDayData();
    }

    goToToday(): void {
        this.selectedDate = new Date();
        this.loadDayData();
    }

    isToday(): boolean {
        const today = new Date();
        return this.selectedDate.toDateString() === today.toDateString();
    }

    exportReport(): void {
        // Export logic
    }

    printReport(): void {
        window.print();
    }
}
