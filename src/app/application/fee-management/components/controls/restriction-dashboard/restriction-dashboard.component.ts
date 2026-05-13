import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';

interface RestrictedStudent {
    id: string;
    admissionNo: string;
    name: string;
    className: string;
    section: string;
    outstandingAmount: number;
    daysOverdue: number;
    restrictions: string[];
    restrictedSince: Date;
    hasOverride: boolean;
}

@Component({
    selector: 'app-restriction-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, DropdownModule, TooltipModule, ChartModule],
    template: `
    <div class="restriction-dashboard">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-ban"></i> Academic Controls Dashboard</h2>
          <p>Overview of fee-based academic restrictions</p>
        </div>
        <div class="header-actions">
          <button pButton label="Configure Rules" icon="pi pi-cog" class="p-button-outlined" routerLink="rules"></button>
          <button pButton label="Late Fee Settings" icon="pi pi-clock" class="p-button-outlined" routerLink="late-fee"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card restricted">
          <div class="summary-icon"><i class="pi pi-ban"></i></div>
          <div class="summary-content">
            <span class="value">{{ restrictedStudents.length }}</span>
            <span class="label">Students Restricted</span>
          </div>
          <div class="summary-trend down">
            <i class="pi pi-arrow-up"></i> +5 this week
          </div>
        </div>
        <div class="summary-card overdue">
          <div class="summary-icon"><i class="pi pi-clock"></i></div>
          <div class="summary-content">
            <span class="value">₹{{ getTotalOverdue() | number }}</span>
            <span class="label">Total Overdue</span>
          </div>
        </div>
        <div class="summary-card override">
          <div class="summary-icon"><i class="pi pi-key"></i></div>
          <div class="summary-content">
            <span class="value">{{ getOverrideCount() }}</span>
            <span class="label">Active Overrides</span>
          </div>
        </div>
        <div class="summary-card action">
          <div class="summary-icon"><i class="pi pi-bell"></i></div>
          <div class="summary-content">
            <span class="value">{{ getRecentCount() }}</span>
            <span class="label">New This Week</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card">
          <h4>Restrictions by Type</h4>
          <p-chart type="doughnut" [data]="restrictionTypeData" [options]="doughnutOptions" [style]="{height:'200px'}"></p-chart>
        </div>
        <div class="chart-card">
          <h4>Restrictions Trend</h4>
          <p-chart type="line" [data]="trendData" [options]="lineOptions" [style]="{height:'200px'}"></p-chart>
        </div>
      </div>

      <!-- Restricted Students List -->
      <div class="content-card">
        <div class="section-header">
          <h3><i class="pi pi-users"></i> Currently Restricted Students</h3>
          <div class="filters">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search..." (input)="filterStudents()" />
            </span>
            <p-dropdown [options]="classOptions" [(ngModel)]="selectedClass" placeholder="All Classes" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterStudents()"></p-dropdown>
          </div>
        </div>

        <p-table [value]="filteredStudents" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Outstanding</th>
              <th>Days Overdue</th>
              <th>Restrictions</th>
              <th>Since</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-s>
            <tr [class.has-override]="s.hasOverride">
              <td>
                <div class="student-cell">
                  <strong>{{ s.name }}</strong>
                  <small>{{ s.admissionNo }}</small>
                </div>
              </td>
              <td>{{ s.className }}-{{ s.section }}</td>
              <td class="amount-danger">₹{{ s.outstandingAmount | number }}</td>
              <td>
                <p-tag [value]="s.daysOverdue + ' days'" [severity]="getDaysSeverity(s.daysOverdue)"></p-tag>
              </td>
              <td>
                <div class="restriction-tags">
                  <p-tag *ngFor="let r of s.restrictions" [value]="r" severity="danger" [style]="{'font-size':'0.7rem'}"></p-tag>
                </div>
              </td>
              <td>{{ s.restrictedSince | date:'dd MMM yyyy' }}</td>
              <td>
                <button pButton icon="pi pi-key" class="p-button-text p-button-sm" pTooltip="Grant Override" routerLink="overrides"></button>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Ledger"></button>
                <span *ngIf="s.hasOverride" class="override-badge" pTooltip="Has Active Override"><i class="pi pi-check-circle"></i></span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-4">
                <div class="empty-state success">
                  <i class="pi pi-check-circle"></i>
                  <h4>No Restrictions Active</h4>
                  <p>All students are in good standing</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
    styles: [`
    .restriction-dashboard { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { display: flex; align-items: center; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; position: relative; }
    .summary-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-card.restricted .summary-icon { background: #fee2e2; color: #ef4444; }
    .summary-card.overdue .summary-icon { background: #fef3c7; color: #f59e0b; }
    .summary-card.override .summary-icon { background: #dbeafe; color: #3b82f6; }
    .summary-card.action .summary-icon { background: #f3e8ff; color: #9333ea; }
    .summary-content { display: flex; flex-direction: column; flex: 1; }
    .summary-content .value { font-size: 1.5rem; font-weight: 700; }
    .summary-content .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .summary-trend { font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .summary-trend.down { background: #fee2e2; color: #ef4444; }

    .charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .chart-card h4 { margin: 0 0 1rem; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .filters { display: flex; gap: 1rem; }

    .student-cell { display: flex; flex-direction: column; }
    .student-cell small { color: var(--text-color-secondary); }
    .amount-danger { color: #ef4444; font-weight: 600; }
    .restriction-tags { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    .has-override { background: rgba(59, 130, 246, 0.05); }
    .override-badge { color: #10b981; margin-left: 0.5rem; }
    .text-center { text-align: center; }

    .empty-state { padding: 2rem; }
    .empty-state.success i { font-size: 3rem; color: #10b981; margin-bottom: 1rem; }
    .empty-state h4 { margin: 0 0 0.5rem; color: #10b981; }
    .empty-state p { margin: 0; color: var(--text-color-secondary); }

    @media (max-width: 768px) { .summary-grid, .charts-row { grid-template-columns: 1fr; } }
  `]
})
export class RestrictionDashboardComponent implements OnInit {
    searchQuery = '';
    selectedClass = '';

    classOptions = [
        { label: 'Class 5', value: 'Class 5' },
        { label: 'Class 8', value: 'Class 8' },
        { label: 'Class 10', value: 'Class 10' },
        { label: 'Class 12', value: 'Class 12' }
    ];

    restrictedStudents: RestrictedStudent[] = [];
    filteredStudents: RestrictedStudent[] = [];

    restrictionTypeData: any;
    trendData: any;
    doughnutOptions: any;
    lineOptions: any;

    ngOnInit(): void {
        this.loadRestrictedStudents();
        this.initCharts();
    }

    loadRestrictedStudents(): void {
        this.restrictedStudents = [
            { id: '1', admissionNo: 'ADM2024001', name: 'Rahul Sharma', className: 'Class 10', section: 'A', outstandingAmount: 36000, daysOverdue: 45, restrictions: ['Exam', 'Report Card'], restrictedSince: new Date('2025-12-01'), hasOverride: false },
            { id: '2', admissionNo: 'ADM2024003', name: 'Amit Kumar', className: 'Class 12', section: 'A', outstandingAmount: 42500, daysOverdue: 30, restrictions: ['Exam'], restrictedSince: new Date('2025-12-15'), hasOverride: true },
            { id: '3', admissionNo: 'ADM2024007', name: 'Rohan Mehta', className: 'Class 8', section: 'B', outstandingAmount: 28000, daysOverdue: 60, restrictions: ['Exam', 'Report Card', 'Transfer'], restrictedSince: new Date('2025-11-15'), hasOverride: false },
            { id: '4', admissionNo: 'ADM2024010', name: 'Kavita Singh', className: 'Class 10', section: 'B', outstandingAmount: 18000, daysOverdue: 15, restrictions: ['Exam'], restrictedSince: new Date('2026-01-01'), hasOverride: false }
        ];
        this.filteredStudents = [...this.restrictedStudents];
    }

    initCharts(): void {
        this.restrictionTypeData = {
            labels: ['Exam Hold', 'Report Card Hold', 'Transfer Block'],
            datasets: [{ data: [15, 8, 3], backgroundColor: ['#ef4444', '#f59e0b', '#6366f1'] }]
        };

        this.trendData = {
            labels: ['Oct', 'Nov', 'Dec', 'Jan'],
            datasets: [{
                label: 'Restricted Students',
                data: [8, 12, 15, 18],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        this.doughnutOptions = { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false };
        this.lineOptions = { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } }, maintainAspectRatio: false };
    }

    filterStudents(): void {
        this.filteredStudents = this.restrictedStudents.filter(s => {
            const matchSearch = !this.searchQuery || s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || s.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchClass = !this.selectedClass || s.className === this.selectedClass;
            return matchSearch && matchClass;
        });
    }

    getTotalOverdue(): number { return this.restrictedStudents.reduce((sum, s) => sum + s.outstandingAmount, 0); }
    getOverrideCount(): number { return this.restrictedStudents.filter(s => s.hasOverride).length; }
    getRecentCount(): number { return this.restrictedStudents.filter(s => s.daysOverdue <= 7).length; }

    getDaysSeverity(days: number): 'success' | 'info' | 'warn' | 'danger' {
        if (days > 45) return 'danger';
        if (days > 30) return 'warn';
        return 'info';
    }
}
