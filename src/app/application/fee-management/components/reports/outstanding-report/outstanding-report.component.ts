import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

interface OutstandingRecord {
    id: string;
    admissionNo: string;
    studentName: string;
    className: string;
    section: string;
    parentName: string;
    parentPhone: string;
    totalDue: number;
    paid: number;
    outstanding: number;
    daysOverdue: number;
    lastPaymentDate: Date | null;
}

interface ClassSummary {
    className: string;
    totalStudents: number;
    studentsWithDues: number;
    totalOutstanding: number;
    percentage: number;
}

@Component({
    selector: 'app-outstanding-report',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, DropdownModule, ChartModule, TagModule, TooltipModule, InputTextModule],
    template: `
    <div class="outstanding-report">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-exclamation-circle"></i> Outstanding Report</h2>
          <p>Pending dues analysis by class and student</p>
        </div>
        <div class="header-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
          <button pButton label="Send Reminders" icon="pi pi-bell" class="p-button-outlined" (click)="sendBulkReminders()"></button>
          <button pButton label="Export" icon="pi pi-download" (click)="exportReport()"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search student..." (input)="filterData()" />
          </span>
          <p-dropdown [options]="classOptions" [(ngModel)]="selectedClass" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Classes" (onChange)="filterData()"></p-dropdown>
          <p-dropdown [options]="overdueOptions" [(ngModel)]="selectedOverdue" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Overdue" (onChange)="filterData()"></p-dropdown>
          <p-dropdown [options]="amountRangeOptions" [(ngModel)]="selectedAmountRange" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Amounts" (onChange)="filterData()"></p-dropdown>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card total">
          <div class="summary-icon"><i class="pi pi-indian-rupee"></i></div>
          <div class="summary-content">
            <span class="summary-value">₹{{ totalOutstanding | number }}</span>
            <span class="summary-label">Total Outstanding</span>
          </div>
        </div>
        <div class="summary-card students">
          <div class="summary-icon"><i class="pi pi-users"></i></div>
          <div class="summary-content">
            <span class="summary-value">{{ studentsWithDues }}</span>
            <span class="summary-label">Students with Dues</span>
          </div>
        </div>
        <div class="summary-card critical">
          <div class="summary-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="summary-content">
            <span class="summary-value">{{ criticalCount }}</span>
            <span class="summary-label">Critical (>60 days)</span>
          </div>
        </div>
        <div class="summary-card average">
          <div class="summary-icon"><i class="pi pi-chart-line"></i></div>
          <div class="summary-content">
            <span class="summary-value">₹{{ avgOutstanding | number }}</span>
            <span class="summary-label">Average Outstanding</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card">
          <h4>Outstanding by Class</h4>
          <p-chart type="bar" [data]="classChartData" [options]="barOptions" [style]="{height:'250px'}"></p-chart>
        </div>
        <div class="chart-card">
          <h4>Overdue Distribution</h4>
          <p-chart type="doughnut" [data]="overdueChartData" [options]="doughnutOptions" [style]="{height:'200px'}"></p-chart>
          <div class="overdue-legend">
            <div class="legend-item"><span class="dot green"></span> 0-15 days: {{ overdue015 }}</div>
            <div class="legend-item"><span class="dot yellow"></span> 16-30 days: {{ overdue1630 }}</div>
            <div class="legend-item"><span class="dot orange"></span> 31-60 days: {{ overdue3160 }}</div>
            <div class="legend-item"><span class="dot red"></span> 60+ days: {{ overdue60plus }}</div>
          </div>
        </div>
      </div>

      <!-- Class Summary Table -->
      <div class="content-card">
        <h3><i class="pi pi-th-large"></i> Class-wise Summary</h3>
        <p-table [value]="classSummary" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Class</th>
              <th>Total Students</th>
              <th>Students with Dues</th>
              <th>Outstanding Amount</th>
              <th>% of Total</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-cs>
            <tr>
              <td><strong>{{ cs.className }}</strong></td>
              <td>{{ cs.totalStudents }}</td>
              <td>
                <span class="dues-badge">{{ cs.studentsWithDues }}</span>
              </td>
              <td class="text-danger">₹{{ cs.totalOutstanding | number }}</td>
              <td>
                <div class="percentage-bar">
                  <div class="bar" [style.width.%]="cs.percentage"></div>
                  <span>{{ cs.percentage }}%</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Student-wise Outstanding -->
      <div class="content-card">
        <div class="table-header">
          <h3><i class="pi pi-list"></i> Student-wise Outstanding</h3>
          <div class="table-actions">
            <button pButton icon="pi pi-file-excel" class="p-button-text p-button-success p-button-sm" pTooltip="Export to Excel"></button>
            <button pButton icon="pi pi-file-pdf" class="p-button-text p-button-danger p-button-sm" pTooltip="Export to PDF"></button>
          </div>
        </div>

        <p-table [value]="filteredRecords" [paginator]="true" [rows]="10" styleClass="p-datatable-striped" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="studentName">Student <p-sortIcon field="studentName"></p-sortIcon></th>
              <th>Class</th>
              <th>Parent Contact</th>
              <th pSortableColumn="totalDue">Total Due <p-sortIcon field="totalDue"></p-sortIcon></th>
              <th pSortableColumn="paid">Paid <p-sortIcon field="paid"></p-sortIcon></th>
              <th pSortableColumn="outstanding">Outstanding <p-sortIcon field="outstanding"></p-sortIcon></th>
              <th pSortableColumn="daysOverdue">Overdue <p-sortIcon field="daysOverdue"></p-sortIcon></th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-rec>
            <tr [class.critical-row]="rec.daysOverdue > 60">
              <td>
                <div class="student-info">
                  <strong>{{ rec.studentName }}</strong>
                  <small>{{ rec.admissionNo }}</small>
                </div>
              </td>
              <td>{{ rec.className }}-{{ rec.section }}</td>
              <td>
                <div class="contact-info">
                  <span>{{ rec.parentName }}</span>
                  <small>{{ rec.parentPhone }}</small>
                </div>
              </td>
              <td>₹{{ rec.totalDue | number }}</td>
              <td class="text-success">₹{{ rec.paid | number }}</td>
              <td class="text-danger"><strong>₹{{ rec.outstanding | number }}</strong></td>
              <td>
                <p-tag [value]="rec.daysOverdue + ' days'" [severity]="getOverdueSeverity(rec.daysOverdue)"></p-tag>
              </td>
              <td>
                <button pButton icon="pi pi-bell" class="p-button-text p-button-warning p-button-sm" pTooltip="Send Reminder" (click)="sendReminder(rec)"></button>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Ledger"></button>
                <button pButton icon="pi pi-indian-rupee" class="p-button-text p-button-success p-button-sm" pTooltip="Record Payment"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8" class="text-center p-4">No outstanding records found</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
    styles: [`
    .outstanding-report { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .filters-card { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; flex-wrap: wrap; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { display: flex; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .summary-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-card.total .summary-icon { background: #fee2e2; color: #dc2626; }
    .summary-card.students .summary-icon { background: #dbeafe; color: #2563eb; }
    .summary-card.critical .summary-icon { background: #fef3c7; color: #d97706; }
    .summary-card.average .summary-icon { background: #f3e8ff; color: #9333ea; }
    .summary-content { display: flex; flex-direction: column; }
    .summary-value { font-size: 1.5rem; font-weight: 700; }
    .summary-label { font-size: 0.875rem; color: var(--text-color-secondary); }

    .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .chart-card h4 { margin: 0 0 1rem; }
    .overdue-legend { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
    .legend-item .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.green { background: #10b981; }
    .dot.yellow { background: #f59e0b; }
    .dot.orange { background: #f97316; }
    .dot.red { background: #dc2626; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .content-card h3 { margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .table-header h3 { margin: 0; }

    .text-success { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .text-center { text-align: center; }

    .dues-badge { background: #fee2e2; color: #dc2626; padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600; }
    .percentage-bar { display: flex; align-items: center; gap: 0.5rem; }
    .percentage-bar .bar { height: 8px; background: #dc2626; border-radius: 4px; min-width: 10px; }

    .student-info, .contact-info { display: flex; flex-direction: column; }
    .student-info small, .contact-info small { color: var(--text-color-secondary); font-size: 0.75rem; }
    .critical-row { background: rgba(220, 38, 38, 0.05); }

    @media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } .charts-row { grid-template-columns: 1fr; } }
  `]
})
export class OutstandingReportComponent implements OnInit {
    searchQuery = '';
    selectedClass = '';
    selectedOverdue = '';
    selectedAmountRange = '';

    totalOutstanding = 1250000;
    studentsWithDues = 156;
    criticalCount = 42;
    avgOutstanding = 8013;

    overdue015 = 45;
    overdue1630 = 52;
    overdue3160 = 17;
    overdue60plus = 42;

    classOptions = [
        { label: 'Class 5', value: 'Class 5' },
        { label: 'Class 8', value: 'Class 8' },
        { label: 'Class 10', value: 'Class 10' },
        { label: 'Class 12', value: 'Class 12' }
    ];

    overdueOptions = [
        { label: '0-15 days', value: '0-15' },
        { label: '16-30 days', value: '16-30' },
        { label: '31-60 days', value: '31-60' },
        { label: '60+ days', value: '60+' }
    ];

    amountRangeOptions = [
        { label: 'Under ₹5,000', value: 'under5k' },
        { label: '₹5,000 - ₹15,000', value: '5k-15k' },
        { label: '₹15,000 - ₹30,000', value: '15k-30k' },
        { label: 'Above ₹30,000', value: 'above30k' }
    ];

    outstandingRecords: OutstandingRecord[] = [];
    filteredRecords: OutstandingRecord[] = [];
    classSummary: ClassSummary[] = [];

    classChartData: any;
    overdueChartData: any;
    barOptions: any;
    doughnutOptions: any;

    ngOnInit(): void {
        this.loadOutstandingData();
        this.loadClassSummary();
        this.initCharts();
    }

    loadOutstandingData(): void {
        this.outstandingRecords = [
            { id: '1', admissionNo: 'ADM2024001', studentName: 'Rahul Sharma', className: 'Class 10', section: 'A', parentName: 'Suresh Sharma', parentPhone: '9876543210', totalDue: 72000, paid: 36000, outstanding: 36000, daysOverdue: 45, lastPaymentDate: new Date('2025-11-15') },
            { id: '2', admissionNo: 'ADM2024003', studentName: 'Amit Kumar', className: 'Class 12', section: 'A', parentName: 'Rajesh Kumar', parentPhone: '9876543211', totalDue: 85000, paid: 42500, outstanding: 42500, daysOverdue: 30, lastPaymentDate: new Date('2025-12-01') },
            { id: '3', admissionNo: 'ADM2024007', studentName: 'Rohan Mehta', className: 'Class 8', section: 'B', parentName: 'Vikram Mehta', parentPhone: '9876543212', totalDue: 56000, paid: 28000, outstanding: 28000, daysOverdue: 60, lastPaymentDate: new Date('2025-10-20') },
            { id: '4', admissionNo: 'ADM2024010', studentName: 'Kavita Singh', className: 'Class 10', section: 'B', parentName: 'Mohan Singh', parentPhone: '9876543213', totalDue: 72000, paid: 54000, outstanding: 18000, daysOverdue: 15, lastPaymentDate: new Date('2025-12-20') },
            { id: '5', admissionNo: 'ADM2024015', studentName: 'Neha Gupta', className: 'Class 5', section: 'A', parentName: 'Anil Gupta', parentPhone: '9876543214', totalDue: 45000, paid: 30000, outstanding: 15000, daysOverdue: 22, lastPaymentDate: new Date('2025-12-10') },
            { id: '6', admissionNo: 'ADM2024018', studentName: 'Vikash Yadav', className: 'Class 12', section: 'B', parentName: 'Shyam Yadav', parentPhone: '9876543215', totalDue: 85000, paid: 35000, outstanding: 50000, daysOverdue: 75, lastPaymentDate: new Date('2025-09-30') },
            { id: '7', admissionNo: 'ADM2024022', studentName: 'Priya Verma', className: 'Class 8', section: 'A', parentName: 'Ramesh Verma', parentPhone: '9876543216', totalDue: 56000, paid: 44000, outstanding: 12000, daysOverdue: 10, lastPaymentDate: new Date('2025-12-28') }
        ];
        this.filteredRecords = [...this.outstandingRecords];
    }

    loadClassSummary(): void {
        this.classSummary = [
            { className: 'Class 5', totalStudents: 87, studentsWithDues: 18, totalOutstanding: 145000, percentage: 12 },
            { className: 'Class 8', totalStudents: 94, studentsWithDues: 32, totalOutstanding: 258000, percentage: 21 },
            { className: 'Class 10', totalStudents: 98, studentsWithDues: 48, totalOutstanding: 420000, percentage: 34 },
            { className: 'Class 12', totalStudents: 102, studentsWithDues: 58, totalOutstanding: 427000, percentage: 34 }
        ];
    }

    initCharts(): void {
        this.classChartData = {
            labels: ['Class 5', 'Class 8', 'Class 10', 'Class 12'],
            datasets: [{
                label: 'Outstanding Amount',
                backgroundColor: ['#60a5fa', '#f59e0b', '#f97316', '#dc2626'],
                data: [145000, 258000, 420000, 427000]
            }]
        };

        this.overdueChartData = {
            labels: ['0-15 days', '16-30 days', '31-60 days', '60+ days'],
            datasets: [{
                data: [this.overdue015, this.overdue1630, this.overdue3160, this.overdue60plus],
                backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#dc2626']
            }]
        };

        this.barOptions = {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } },
            maintainAspectRatio: false
        };

        this.doughnutOptions = {
            plugins: { legend: { display: false } },
            cutout: '65%',
            maintainAspectRatio: false
        };
    }

    filterData(): void {
        this.filteredRecords = this.outstandingRecords.filter(rec => {
            const matchSearch = !this.searchQuery ||
                rec.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                rec.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchClass = !this.selectedClass || rec.className === this.selectedClass;
            let matchOverdue = true;
            if (this.selectedOverdue) {
                if (this.selectedOverdue === '0-15') matchOverdue = rec.daysOverdue <= 15;
                else if (this.selectedOverdue === '16-30') matchOverdue = rec.daysOverdue > 15 && rec.daysOverdue <= 30;
                else if (this.selectedOverdue === '31-60') matchOverdue = rec.daysOverdue > 30 && rec.daysOverdue <= 60;
                else if (this.selectedOverdue === '60+') matchOverdue = rec.daysOverdue > 60;
            }
            return matchSearch && matchClass && matchOverdue;
        });
    }

    getOverdueSeverity(days: number): 'success' | 'info' | 'warn' | 'danger' {
        if (days <= 15) return 'success';
        if (days <= 30) return 'info';
        if (days <= 60) return 'warn';
        return 'danger';
    }

    sendReminder(record: OutstandingRecord): void {
        // Send individual reminder
    }

    sendBulkReminders(): void {
        // Send bulk reminders
    }

    exportReport(): void {
        // Export logic
    }
}
