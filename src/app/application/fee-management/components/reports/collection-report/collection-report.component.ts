import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

interface CollectionRecord {
    id: string;
    className: string;
    section: string;
    totalStudents: number;
    totalDue: number;
    collected: number;
    pending: number;
    collectionRate: number;
}

interface FeeHeadCollection {
    feeHead: string;
    due: number;
    collected: number;
    pending: number;
}

@Component({
    selector: 'app-collection-report',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, DropdownModule, CalendarModule, ChartModule, TagModule, TooltipModule],
    template: `
    <div class="collection-report">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-indian-rupee"></i> Collection Report</h2>
          <p>Fee collection summary and analysis</p>
        </div>
        <div class="header-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
          <button pButton label="Export" icon="pi pi-download" class="p-button-outlined" (click)="exportReport()"></button>
          <button pButton label="Print" icon="pi pi-print" (click)="printReport()"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-item">
            <label>Period</label>
            <p-dropdown [options]="periodOptions" [(ngModel)]="selectedPeriod" optionLabel="label" optionValue="value" (onChange)="generateReport()"></p-dropdown>
          </div>
          <div class="filter-item" *ngIf="selectedPeriod === 'custom'">
            <label>Date Range</label>
            <p-calendar [(ngModel)]="dateRange" selectionMode="range" dateFormat="dd/mm/yy" [showIcon]="true" placeholder="Select range"></p-calendar>
          </div>
          <div class="filter-item">
            <label>Class</label>
            <p-dropdown [options]="classOptions" [(ngModel)]="selectedClass" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Classes" (onChange)="generateReport()"></p-dropdown>
          </div>
          <div class="filter-item">
            <label>Fee Head</label>
            <p-dropdown [options]="feeHeadOptions" [(ngModel)]="selectedFeeHead" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Fee Heads" (onChange)="generateReport()"></p-dropdown>
          </div>
          <div class="filter-item">
            <button pButton label="Generate" icon="pi pi-refresh" (click)="generateReport()"></button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-header">Total Due</div>
          <div class="summary-value">₹{{ totalDue | number }}</div>
          <div class="summary-sub">For selected period</div>
        </div>
        <div class="summary-card collected">
          <div class="summary-header">Total Collected</div>
          <div class="summary-value">₹{{ totalCollected | number }}</div>
          <div class="summary-progress">
            <div class="progress-bar" [style.width.%]="collectionPercentage"></div>
          </div>
          <div class="summary-sub">{{ collectionPercentage }}% of total</div>
        </div>
        <div class="summary-card pending">
          <div class="summary-header">Pending</div>
          <div class="summary-value">₹{{ totalPending | number }}</div>
          <div class="summary-sub">{{ 100 - collectionPercentage }}% remaining</div>
        </div>
        <div class="summary-card transactions">
          <div class="summary-header">Transactions</div>
          <div class="summary-value">{{ totalTransactions }}</div>
          <div class="summary-sub">Avg: ₹{{ avgTransaction | number }}</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card">
          <h4>Collection by Fee Head</h4>
          <p-chart type="bar" [data]="feeHeadChartData" [options]="barOptions" [style]="{height:'250px'}"></p-chart>
        </div>
        <div class="chart-card">
          <h4>Collection Trend</h4>
          <p-chart type="line" [data]="trendChartData" [options]="lineOptions" [style]="{height:'250px'}"></p-chart>
        </div>
      </div>

      <!-- Class-wise Collection Table -->
      <div class="content-card">
        <div class="table-header">
          <h3><i class="pi pi-table"></i> Class-wise Collection</h3>
          <div class="table-actions">
            <button pButton icon="pi pi-file-excel" class="p-button-text p-button-success p-button-sm" pTooltip="Export to Excel"></button>
            <button pButton icon="pi pi-file-pdf" class="p-button-text p-button-danger p-button-sm" pTooltip="Export to PDF"></button>
          </div>
        </div>

        <p-table [value]="collectionData" styleClass="p-datatable-striped" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="className">Class <p-sortIcon field="className"></p-sortIcon></th>
              <th>Section</th>
              <th pSortableColumn="totalStudents">Students <p-sortIcon field="totalStudents"></p-sortIcon></th>
              <th pSortableColumn="totalDue">Total Due <p-sortIcon field="totalDue"></p-sortIcon></th>
              <th pSortableColumn="collected">Collected <p-sortIcon field="collected"></p-sortIcon></th>
              <th pSortableColumn="pending">Pending <p-sortIcon field="pending"></p-sortIcon></th>
              <th pSortableColumn="collectionRate">Rate <p-sortIcon field="collectionRate"></p-sortIcon></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td><strong>{{ row.className }}</strong></td>
              <td>{{ row.section }}</td>
              <td>{{ row.totalStudents }}</td>
              <td>₹{{ row.totalDue | number }}</td>
              <td class="text-success">₹{{ row.collected | number }}</td>
              <td class="text-danger">₹{{ row.pending | number }}</td>
              <td>
                <div class="rate-cell">
                  <div class="rate-bar" [style.width.%]="row.collectionRate" [class.high]="row.collectionRate >= 80" [class.medium]="row.collectionRate >= 50 && row.collectionRate < 80" [class.low]="row.collectionRate < 50"></div>
                  <span>{{ row.collectionRate }}%</span>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr class="footer-row">
              <td colspan="2"><strong>Total</strong></td>
              <td><strong>{{ getTotalStudents() }}</strong></td>
              <td><strong>₹{{ totalDue | number }}</strong></td>
              <td class="text-success"><strong>₹{{ totalCollected | number }}</strong></td>
              <td class="text-danger"><strong>₹{{ totalPending | number }}</strong></td>
              <td><strong>{{ collectionPercentage }}%</strong></td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Fee Head Breakdown -->
      <div class="content-card">
        <h3><i class="pi pi-list"></i> Fee Head Breakdown</h3>
        <p-table [value]="feeHeadData" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Fee Head</th>
              <th>Due Amount</th>
              <th>Collected</th>
              <th>Pending</th>
              <th>Collection %</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-fh>
            <tr>
              <td><strong>{{ fh.feeHead }}</strong></td>
              <td>₹{{ fh.due | number }}</td>
              <td class="text-success">₹{{ fh.collected | number }}</td>
              <td class="text-danger">₹{{ fh.pending | number }}</td>
              <td>
                <p-tag [value]="getPercentage(fh.collected, fh.due) + '%'" [severity]="getPercentageSeverity(fh.collected, fh.due)"></p-tag>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
    styles: [`
    .collection-report { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .filters-card { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-item label { font-size: 0.875rem; font-weight: 500; color: var(--text-color-secondary); }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .summary-header { font-size: 0.875rem; color: var(--text-color-secondary); margin-bottom: 0.5rem; }
    .summary-value { font-size: 1.75rem; font-weight: 700; }
    .summary-sub { font-size: 0.75rem; color: var(--text-color-secondary); margin-top: 0.5rem; }
    .summary-card.collected .summary-value { color: #16a34a; }
    .summary-card.pending .summary-value { color: #dc2626; }
    .summary-card.transactions .summary-value { color: #2563eb; }
    .summary-progress { height: 6px; background: var(--surface-ground); border-radius: 3px; margin-top: 0.5rem; overflow: hidden; }
    .progress-bar { height: 100%; background: #16a34a; border-radius: 3px; transition: width 0.3s; }

    .charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .chart-card h4 { margin: 0 0 1rem; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .content-card h3 { margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .table-header h3 { margin: 0; }
    .table-actions { display: flex; gap: 0.5rem; }

    .text-success { color: #16a34a; }
    .text-danger { color: #dc2626; }

    .rate-cell { display: flex; align-items: center; gap: 0.5rem; }
    .rate-bar { height: 8px; border-radius: 4px; min-width: 20px; }
    .rate-bar.high { background: #16a34a; }
    .rate-bar.medium { background: #f59e0b; }
    .rate-bar.low { background: #dc2626; }

    .footer-row { background: var(--surface-ground); }

    @media (max-width: 768px) { .summary-grid, .charts-row { grid-template-columns: 1fr; } .filters-row { flex-direction: column; align-items: stretch; } }
  `]
})
export class CollectionReportComponent implements OnInit {
    selectedPeriod = 'this_month';
    dateRange: Date[] | null = null;
    selectedClass = '';
    selectedFeeHead = '';

    totalDue = 6100000;
    totalCollected = 4850000;
    totalPending = 1250000;
    totalTransactions = 523;
    collectionPercentage = 79.5;
    avgTransaction = 9274;

    periodOptions = [
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'This Quarter', value: 'this_quarter' },
        { label: 'This Year', value: 'this_year' },
        { label: 'Custom Range', value: 'custom' }
    ];

    classOptions = [
        { label: 'Class 5', value: 'Class 5' },
        { label: 'Class 8', value: 'Class 8' },
        { label: 'Class 10', value: 'Class 10' },
        { label: 'Class 12', value: 'Class 12' }
    ];

    feeHeadOptions = [
        { label: 'Tuition Fee', value: 'Tuition' },
        { label: 'Transport Fee', value: 'Transport' },
        { label: 'Lab Fee', value: 'Lab' },
        { label: 'Library Fee', value: 'Library' }
    ];

    collectionData: CollectionRecord[] = [];
    feeHeadData: FeeHeadCollection[] = [];
    feeHeadChartData: any;
    trendChartData: any;
    barOptions: any;
    lineOptions: any;

    ngOnInit(): void {
        this.loadCollectionData();
        this.loadFeeHeadData();
        this.initCharts();
    }

    loadCollectionData(): void {
        this.collectionData = [
            { id: '1', className: 'Class 5', section: 'A', totalStudents: 45, totalDue: 450000, collected: 380000, pending: 70000, collectionRate: 84 },
            { id: '2', className: 'Class 5', section: 'B', totalStudents: 42, totalDue: 420000, collected: 350000, pending: 70000, collectionRate: 83 },
            { id: '3', className: 'Class 8', section: 'A', totalStudents: 48, totalDue: 576000, collected: 450000, pending: 126000, collectionRate: 78 },
            { id: '4', className: 'Class 8', section: 'B', totalStudents: 46, totalDue: 552000, collected: 420000, pending: 132000, collectionRate: 76 },
            { id: '5', className: 'Class 10', section: 'A', totalStudents: 50, totalDue: 750000, collected: 600000, pending: 150000, collectionRate: 80 },
            { id: '6', className: 'Class 10', section: 'B', totalStudents: 48, totalDue: 720000, collected: 550000, pending: 170000, collectionRate: 76 },
            { id: '7', className: 'Class 12', section: 'A', totalStudents: 52, totalDue: 936000, collected: 780000, pending: 156000, collectionRate: 83 },
            { id: '8', className: 'Class 12', section: 'B', totalStudents: 50, totalDue: 900000, collected: 720000, pending: 180000, collectionRate: 80 }
        ];
    }

    loadFeeHeadData(): void {
        this.feeHeadData = [
            { feeHead: 'Tuition Fee', due: 4200000, collected: 3400000, pending: 800000 },
            { feeHead: 'Transport Fee', due: 850000, collected: 680000, pending: 170000 },
            { feeHead: 'Lab Fee', due: 520000, collected: 420000, pending: 100000 },
            { feeHead: 'Library Fee', due: 280000, collected: 220000, pending: 60000 },
            { feeHead: 'Sports Fee', due: 250000, collected: 130000, pending: 120000 }
        ];
    }

    initCharts(): void {
        this.feeHeadChartData = {
            labels: ['Tuition', 'Transport', 'Lab', 'Library', 'Sports'],
            datasets: [
                { label: 'Collected', backgroundColor: '#10b981', data: [3400000, 680000, 420000, 220000, 130000] },
                { label: 'Pending', backgroundColor: '#f59e0b', data: [800000, 170000, 100000, 60000, 120000] }
            ]
        };

        this.trendChartData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Collection',
                data: [980000, 1250000, 1420000, 1200000],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        this.barOptions = {
            plugins: { legend: { position: 'bottom' } },
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
            maintainAspectRatio: false
        };

        this.lineOptions = {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
            maintainAspectRatio: false
        };
    }

    generateReport(): void {
        // Refresh report data based on filters
    }

    getTotalStudents(): number {
        return this.collectionData.reduce((sum, row) => sum + row.totalStudents, 0);
    }

    getPercentage(collected: number, due: number): number {
        return Math.round((collected / due) * 100);
    }

    getPercentageSeverity(collected: number, due: number): 'success' | 'warn' | 'danger' {
        const pct = this.getPercentage(collected, due);
        if (pct >= 80) return 'success';
        if (pct >= 50) return 'warn';
        return 'danger';
    }

    exportReport(): void {
        // Export logic
    }

    printReport(): void {
        window.print();
    }
}
