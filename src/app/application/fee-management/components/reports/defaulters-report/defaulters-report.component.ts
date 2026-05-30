import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface Defaulter {
    id: string;
    admissionNo: string;
    studentName: string;
    className: string;
    section: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    outstandingAmount: number;
    daysOverdue: number;
    lastPaymentDate: Date | null;
    remindersSent: number;
    lastReminderDate: Date | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Component({
    selector: 'app-defaulters-report',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, DropdownModule, TagModule, InputTextModule, TooltipModule, ChartModule, ToastModule],
    providers: [MessageService],
    template: `
    <div class="defaulters-report">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h2><i class="pi pi-users"></i> Defaulters Report</h2>
          <p>Students with overdue fee payments</p>
        </div>
        <div class="header-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
          <button pButton label="Send Bulk Reminders" icon="pi pi-bell" class="p-button-warning" (click)="sendBulkReminders()" [disabled]="selectedDefaulters.length === 0"></button>
          <button pButton label="Export" icon="pi pi-download" (click)="exportReport()"></button>
        </div>
      </div>

      <!-- Priority Stats -->
      <div class="priority-grid">
        <div class="priority-card critical" (click)="filterByPriority('CRITICAL')">
          <div class="priority-icon"><i class="pi pi-exclamation-circle"></i></div>
          <div class="priority-content">
            <span class="priority-value">{{ getCriticalCount() }}</span>
            <span class="priority-label">Critical (&gt;60 days)</span>
          </div>
          <span class="priority-amount">₹{{ getCriticalAmount() | number }}</span>
        </div>
        <div class="priority-card high" (click)="filterByPriority('HIGH')">
          <div class="priority-icon"><i class="pi pi-arrow-up"></i></div>
          <div class="priority-content">
            <span class="priority-value">{{ getHighCount() }}</span>
            <span class="priority-label">High (31-60 days)</span>
          </div>
          <span class="priority-amount">₹{{ getHighAmount() | number }}</span>
        </div>
        <div class="priority-card medium" (click)="filterByPriority('MEDIUM')">
          <div class="priority-icon"><i class="pi pi-minus"></i></div>
          <div class="priority-content">
            <span class="priority-value">{{ getMediumCount() }}</span>
            <span class="priority-label">Medium (16-30 days)</span>
          </div>
          <span class="priority-amount">₹{{ getMediumAmount() | number }}</span>
        </div>
        <div class="priority-card low" (click)="filterByPriority('LOW')">
          <div class="priority-icon"><i class="pi pi-arrow-down"></i></div>
          <div class="priority-content">
            <span class="priority-value">{{ getLowCount() }}</span>
            <span class="priority-label">Low (1-15 days)</span>
          </div>
          <span class="priority-amount">₹{{ getLowAmount() | number }}</span>
        </div>
      </div>

      <!-- Summary Row -->
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">Total Defaulters</span>
          <span class="summary-value">{{ defaulters.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Outstanding</span>
          <span class="summary-value text-danger">₹{{ getTotalOutstanding() | number }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Avg Overdue Days</span>
          <span class="summary-value">{{ getAvgOverdueDays() }} days</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Reminders Sent Today</span>
          <span class="summary-value">{{ remindersSentToday }}</span>
        </div>
      </div>

      <!-- Filters & Table -->
      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search student or parent..." (input)="filterDefaulters()" />
          </span>
          <p-dropdown [options]="classOptions" [(ngModel)]="selectedClass" placeholder="All Classes" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterDefaulters()"></p-dropdown>
          <p-dropdown [options]="priorityOptions" [(ngModel)]="selectedPriority" placeholder="All Priorities" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterDefaulters()"></p-dropdown>
          <p-dropdown [options]="amountOptions" [(ngModel)]="selectedAmountRange" placeholder="All Amounts" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterDefaulters()"></p-dropdown>
          <button pButton label="Clear Filters" icon="pi pi-filter-slash" class="p-button-text" (click)="clearFilters()"></button>
        </div>

        <p-table [value]="filteredDefaulters" [paginator]="true" [rows]="10" [(selection)]="selectedDefaulters" styleClass="p-datatable-striped" [rowHover]="true" dataKey="id">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:3rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
              <th pSortableColumn="studentName">Student <p-sortIcon field="studentName"></p-sortIcon></th>
              <th>Class</th>
              <th>Parent Contact</th>
              <th pSortableColumn="outstandingAmount">Outstanding <p-sortIcon field="outstandingAmount"></p-sortIcon></th>
              <th pSortableColumn="daysOverdue">Overdue <p-sortIcon field="daysOverdue"></p-sortIcon></th>
              <th>Priority</th>
              <th>Reminders</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-d>
            <tr [class.critical-row]="d.priority === 'CRITICAL'">
              <td><p-tableCheckbox [value]="d"></p-tableCheckbox></td>
              <td>
                <div class="student-info">
                  <strong>{{ d.studentName }}</strong>
                  <small>{{ d.admissionNo }}</small>
                </div>
              </td>
              <td>{{ d.className }}-{{ d.section }}</td>
              <td>
                <div class="contact-info">
                  <span>{{ d.parentName }}</span>
                  <small>{{ d.parentPhone }}</small>
                </div>
              </td>
              <td class="amount-cell">₹{{ d.outstandingAmount | number }}</td>
              <td>
                <div class="overdue-info">
                  <strong>{{ d.daysOverdue }} days</strong>
                  <small *ngIf="d.lastPaymentDate">Last: {{ d.lastPaymentDate | date:'dd MMM' }}</small>
                </div>
              </td>
              <td>
                <p-tag [value]="d.priority" [severity]="getPrioritySeverity(d.priority)" [style]="{'font-size':'0.75rem'}"></p-tag>
              </td>
              <td>
                <div class="reminder-info">
                  <span class="reminder-count">{{ d.remindersSent }}</span>
                  <small *ngIf="d.lastReminderDate">{{ d.lastReminderDate | date:'dd MMM' }}</small>
                </div>
              </td>
              <td>
                <button pButton icon="pi pi-bell" class="p-button-text p-button-warning p-button-sm" pTooltip="Send Reminder" (click)="sendReminder(d)"></button>
                <button pButton icon="pi pi-whatsapp" class="p-button-text p-button-success p-button-sm" pTooltip="WhatsApp" (click)="sendWhatsApp(d)"></button>
                <button pButton icon="pi pi-phone" class="p-button-text p-button-info p-button-sm" pTooltip="Call" (click)="initiateCall(d)"></button>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Ledger"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <h4>No Defaulters Found</h4>
                  <p>All students are up to date with their payments</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card">
          <h4>Defaulters by Class</h4>
          <p-chart type="bar" [data]="classChartData" [options]="barOptions" [style]="{height:'250px'}"></p-chart>
        </div>
        <div class="chart-card">
          <h4>Priority Distribution</h4>
          <p-chart type="doughnut" [data]="priorityChartData" [options]="doughnutOptions" [style]="{height:'220px'}"></p-chart>
        </div>
      </div>

      <!-- Action Summary -->
      <div class="action-card">
        <h3><i class="pi pi-megaphone"></i> Recommended Actions</h3>
        <div class="action-grid">
          <div class="action-item critical">
            <div class="action-header">
              <span class="action-badge">{{ getCriticalCount() }}</span>
              <h4>Critical Cases</h4>
            </div>
            <p>Students with &gt;60 days overdue need immediate escalation. Consider meeting with parents.</p>
            <button pButton label="Send Escalation Notice" icon="pi pi-send" class="p-button-danger p-button-sm"></button>
          </div>
          <div class="action-item high">
            <div class="action-header">
              <span class="action-badge">{{ getHighCount() }}</span>
              <h4>High Priority</h4>
            </div>
            <p>Students 31-60 days overdue should receive phone call reminders this week.</p>
            <button pButton label="Schedule Calls" icon="pi pi-phone" class="p-button-warning p-button-sm"></button>
          </div>
          <div class="action-item reminder">
            <div class="action-header">
              <span class="action-badge">{{ getMediumCount() + getLowCount() }}</span>
              <h4>Send Reminders</h4>
            </div>
            <p>Medium and low priority defaulters should receive SMS/Email reminders.</p>
            <button pButton label="Send Bulk SMS" icon="pi pi-envelope" class="p-button-info p-button-sm"></button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .defaulters-report { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .priority-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .priority-card { display: flex; align-items: center; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
    .priority-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .priority-card.critical { border-left: 4px solid #dc2626; }
    .priority-card.high { border-left: 4px solid #f97316; }
    .priority-card.medium { border-left: 4px solid #f59e0b; }
    .priority-card.low { border-left: 4px solid #10b981; }
    .priority-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .priority-card.critical .priority-icon { background: #fee2e2; color: #dc2626; }
    .priority-card.high .priority-icon { background: #ffedd5; color: #f97316; }
    .priority-card.medium .priority-icon { background: #fef3c7; color: #f59e0b; }
    .priority-card.low .priority-icon { background: #dcfce7; color: #10b981; }
    .priority-content { flex: 1; display: flex; flex-direction: column; }
    .priority-value { font-size: 1.5rem; font-weight: 700; }
    .priority-label { font-size: 0.75rem; color: var(--text-color-secondary); }
    .priority-amount { font-weight: 600; color: #dc2626; font-size: 0.875rem; }

    .summary-row { display: flex; gap: 2rem; padding: 1.25rem 1.5rem; background: var(--surface-card); border-radius: 12px; margin-bottom: 1.5rem; }
    .summary-item { display: flex; flex-direction: column; }
    .summary-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .summary-value { font-size: 1.25rem; font-weight: 700; }
    .text-danger { color: #dc2626; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

    .student-info, .contact-info, .overdue-info, .reminder-info { display: flex; flex-direction: column; }
    .student-info small, .contact-info small, .overdue-info small { color: var(--text-color-secondary); font-size: 0.75rem; }
    .amount-cell { font-weight: 600; color: #dc2626; }
    .reminder-count { font-weight: 600; font-size: 1.1rem; }
    .reminder-info small { color: var(--text-color-secondary); font-size: 0.7rem; }
    .critical-row { background: rgba(220, 38, 38, 0.05); }
    .text-center { text-align: center; }

    .empty-state { padding: 2rem; }
    .empty-state i { font-size: 3rem; color: #10b981; margin-bottom: 1rem; }
    .empty-state h4 { margin: 0 0 0.5rem; color: #10b981; }
    .empty-state p { margin: 0; color: var(--text-color-secondary); }

    .charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .chart-card h4 { margin: 0 0 1rem; }

    .action-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .action-card h3 { margin: 0 0 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .action-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .action-item { padding: 1.25rem; border-radius: 10px; background: var(--surface-ground); }
    .action-item.critical { border-left: 3px solid #dc2626; }
    .action-item.high { border-left: 3px solid #f97316; }
    .action-item.reminder { border-left: 3px solid #3b82f6; }
    .action-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .action-badge { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; }
    .action-item.critical .action-badge { background: #dc2626; }
    .action-item.high .action-badge { background: #f97316; }
    .action-header h4 { margin: 0; font-size: 1rem; }
    .action-item p { margin: 0 0 1rem; font-size: 0.875rem; color: var(--text-color-secondary); }

    @media (max-width: 1024px) { .priority-grid { grid-template-columns: repeat(2, 1fr); } .action-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .priority-grid { grid-template-columns: 1fr; } .charts-row { grid-template-columns: 1fr; } .summary-row { flex-direction: column; gap: 1rem; } }
  `]
})
export class DefaultersReportComponent implements OnInit {
    searchQuery = '';
    selectedClass = '';
    selectedPriority = '';
    selectedAmountRange = '';
    remindersSentToday = 15;

    selectedDefaulters: Defaulter[] = [];

    classOptions = [
        { label: 'Class 5', value: 'Class 5' },
        { label: 'Class 8', value: 'Class 8' },
        { label: 'Class 10', value: 'Class 10' },
        { label: 'Class 12', value: 'Class 12' }
    ];

    priorityOptions = [
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' }
    ];

    amountOptions = [
        { label: 'Under ₹10,000', value: 'under10k' },
        { label: '₹10,000 - ₹25,000', value: '10k-25k' },
        { label: '₹25,000 - ₹50,000', value: '25k-50k' },
        { label: 'Above ₹50,000', value: 'above50k' }
    ];

    defaulters: Defaulter[] = [];
    filteredDefaulters: Defaulter[] = [];

    classChartData: any;
    priorityChartData: any;
    barOptions: any;
    doughnutOptions: any;

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.loadDefaulters();
        this.initCharts();
    }

    loadDefaulters(): void {
        this.defaulters = [
            { id: '1', admissionNo: 'ADM2024001', studentName: 'Rahul Sharma', className: 'Class 10', section: 'A', parentName: 'Suresh Sharma', parentPhone: '9876543210', parentEmail: 'suresh@email.com', outstandingAmount: 36000, daysOverdue: 45, lastPaymentDate: new Date('2025-11-15'), remindersSent: 3, lastReminderDate: new Date('2026-01-10'), priority: 'HIGH' },
            { id: '2', admissionNo: 'ADM2024003', studentName: 'Amit Kumar', className: 'Class 12', section: 'A', parentName: 'Rajesh Kumar', parentPhone: '9876543211', parentEmail: 'rajesh@email.com', outstandingAmount: 42500, daysOverdue: 30, lastPaymentDate: new Date('2025-12-01'), remindersSent: 2, lastReminderDate: new Date('2026-01-08'), priority: 'MEDIUM' },
            { id: '3', admissionNo: 'ADM2024007', studentName: 'Rohan Mehta', className: 'Class 8', section: 'B', parentName: 'Vikram Mehta', parentPhone: '9876543212', parentEmail: 'vikram@email.com', outstandingAmount: 58000, daysOverdue: 75, lastPaymentDate: new Date('2025-10-01'), remindersSent: 5, lastReminderDate: new Date('2026-01-12'), priority: 'CRITICAL' },
            { id: '4', admissionNo: 'ADM2024010', studentName: 'Kavita Singh', className: 'Class 10', section: 'B', parentName: 'Mohan Singh', parentPhone: '9876543213', parentEmail: 'mohan@email.com', outstandingAmount: 18000, daysOverdue: 12, lastPaymentDate: new Date('2025-12-28'), remindersSent: 1, lastReminderDate: new Date('2026-01-05'), priority: 'LOW' },
            { id: '5', admissionNo: 'ADM2024015', studentName: 'Neha Gupta', className: 'Class 5', section: 'A', parentName: 'Anil Gupta', parentPhone: '9876543214', parentEmail: 'anil@email.com', outstandingAmount: 15000, daysOverdue: 22, lastPaymentDate: new Date('2025-12-10'), remindersSent: 2, lastReminderDate: new Date('2026-01-06'), priority: 'MEDIUM' },
            { id: '6', admissionNo: 'ADM2024018', studentName: 'Vikash Yadav', className: 'Class 12', section: 'B', parentName: 'Shyam Yadav', parentPhone: '9876543215', parentEmail: 'shyam@email.com', outstandingAmount: 65000, daysOverdue: 90, lastPaymentDate: new Date('2025-09-15'), remindersSent: 6, lastReminderDate: new Date('2026-01-14'), priority: 'CRITICAL' },
            { id: '7', admissionNo: 'ADM2024022', studentName: 'Priya Verma', className: 'Class 8', section: 'A', parentName: 'Ramesh Verma', parentPhone: '9876543216', parentEmail: 'ramesh@email.com', outstandingAmount: 12000, daysOverdue: 8, lastPaymentDate: new Date('2026-01-02'), remindersSent: 1, lastReminderDate: null, priority: 'LOW' },
            { id: '8', admissionNo: 'ADM2024025', studentName: 'Deepak Joshi', className: 'Class 10', section: 'A', parentName: 'Pramod Joshi', parentPhone: '9876543217', parentEmail: 'pramod@email.com', outstandingAmount: 48000, daysOverdue: 55, lastPaymentDate: new Date('2025-11-01'), remindersSent: 4, lastReminderDate: new Date('2026-01-11'), priority: 'HIGH' }
        ];
        this.filteredDefaulters = [...this.defaulters];
    }

    initCharts(): void {
        this.classChartData = {
            labels: ['Class 5', 'Class 8', 'Class 10', 'Class 12'],
            datasets: [{
                label: 'Defaulters',
                backgroundColor: ['#60a5fa', '#f59e0b', '#f97316', '#dc2626'],
                data: [1, 2, 3, 2]
            }]
        };

        this.priorityChartData = {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [this.getCriticalCount(), this.getHighCount(), this.getMediumCount(), this.getLowCount()],
                backgroundColor: ['#dc2626', '#f97316', '#f59e0b', '#10b981']
            }]
        };

        this.barOptions = {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            maintainAspectRatio: false
        };

        this.doughnutOptions = {
            plugins: { legend: { position: 'bottom' } },
            cutout: '60%',
            maintainAspectRatio: false
        };
    }

    filterDefaulters(): void {
        this.filteredDefaulters = this.defaulters.filter(d => {
            const matchSearch = !this.searchQuery ||
                d.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                d.parentName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                d.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchClass = !this.selectedClass || d.className === this.selectedClass;
            const matchPriority = !this.selectedPriority || d.priority === this.selectedPriority;
            return matchSearch && matchClass && matchPriority;
        });
    }

    filterByPriority(priority: string): void {
        this.selectedPriority = priority;
        this.filterDefaulters();
    }

    clearFilters(): void {
        this.searchQuery = '';
        this.selectedClass = '';
        this.selectedPriority = '';
        this.selectedAmountRange = '';
        this.filteredDefaulters = [...this.defaulters];
    }

    getCriticalCount(): number { return this.defaulters.filter(d => d.priority === 'CRITICAL').length; }
    getHighCount(): number { return this.defaulters.filter(d => d.priority === 'HIGH').length; }
    getMediumCount(): number { return this.defaulters.filter(d => d.priority === 'MEDIUM').length; }
    getLowCount(): number { return this.defaulters.filter(d => d.priority === 'LOW').length; }

    getCriticalAmount(): number { return this.defaulters.filter(d => d.priority === 'CRITICAL').reduce((sum, d) => sum + d.outstandingAmount, 0); }
    getHighAmount(): number { return this.defaulters.filter(d => d.priority === 'HIGH').reduce((sum, d) => sum + d.outstandingAmount, 0); }
    getMediumAmount(): number { return this.defaulters.filter(d => d.priority === 'MEDIUM').reduce((sum, d) => sum + d.outstandingAmount, 0); }
    getLowAmount(): number { return this.defaulters.filter(d => d.priority === 'LOW').reduce((sum, d) => sum + d.outstandingAmount, 0); }

    getTotalOutstanding(): number { return this.defaulters.reduce((sum, d) => sum + d.outstandingAmount, 0); }
    getAvgOverdueDays(): number { return Math.round(this.defaulters.reduce((sum, d) => sum + d.daysOverdue, 0) / this.defaulters.length); }

    getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = { 'LOW': 'success', 'MEDIUM': 'warn', 'HIGH': 'warn', 'CRITICAL': 'danger' };
        return map[priority] || 'info';
    }

    sendReminder(d: Defaulter): void {
        d.remindersSent++;
        d.lastReminderDate = new Date();
        this.messageService.add({ severity: 'success', summary: 'Reminder Sent', detail: `Reminder sent to ${d.parentName}`, life: 3000 });
    }

    sendWhatsApp(d: Defaulter): void {
        this.messageService.add({ severity: 'info', summary: 'WhatsApp', detail: `Opening WhatsApp for ${d.parentPhone}`, life: 3000 });
    }

    initiateCall(d: Defaulter): void {
        this.messageService.add({ severity: 'info', summary: 'Call', detail: `Initiating call to ${d.parentPhone}`, life: 3000 });
    }

    sendBulkReminders(): void {
        this.selectedDefaulters.forEach(d => {
            d.remindersSent++;
            d.lastReminderDate = new Date();
        });
        this.messageService.add({ severity: 'success', summary: 'Bulk Reminders', detail: `Reminders sent to ${this.selectedDefaulters.length} parents`, life: 3000 });
        this.selectedDefaulters = [];
    }

    exportReport(): void {
        this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Generating defaulters report...', life: 3000 });
    }
}
