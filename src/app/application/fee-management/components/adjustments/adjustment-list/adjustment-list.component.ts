import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';

interface Adjustment {
    id: string;
    adjustmentNo: string;
    date: Date;
    studentName: string;
    admissionNo: string;
    className: string;
    type: 'DISCOUNT' | 'WAIVER' | 'PENALTY' | 'REFUND';
    reason: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdBy: string;
    approvedBy?: string;
    approvalDate?: Date;
}

@Component({
    selector: 'app-adjustment-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, DropdownModule, CalendarModule, TooltipModule, DialogModule],
    template: `
    <div class="adjustment-list">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-percentage"></i> Fee Adjustments</h2>
          <p>Manage fee discounts, waivers, penalties, and refunds</p>
        </div>
        <div class="header-actions">
          <button pButton label="Pending Approvals" icon="pi pi-clock" class="p-button-outlined" routerLink="pending"></button>
          <button pButton label="Create Adjustment" icon="pi pi-plus" routerLink="create"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card pending">
          <div class="summary-icon"><i class="pi pi-clock"></i></div>
          <div class="summary-content">
            <span class="value">{{ getPendingCount() }}</span>
            <span class="label">Pending Approval</span>
          </div>
        </div>
        <div class="summary-card approved">
          <div class="summary-icon"><i class="pi pi-check-circle"></i></div>
          <div class="summary-content">
            <span class="value">{{ getApprovedCount() }}</span>
            <span class="label">Approved</span>
          </div>
        </div>
        <div class="summary-card discount">
          <div class="summary-icon"><i class="pi pi-percentage"></i></div>
          <div class="summary-content">
            <span class="value">₹{{ getTotalDiscounts() | number }}</span>
            <span class="label">Total Discounts</span>
          </div>
        </div>
        <div class="summary-card penalty">
          <div class="summary-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="summary-content">
            <span class="value">₹{{ getTotalPenalties() | number }}</span>
            <span class="label">Total Penalties</span>
          </div>
        </div>
      </div>

      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search student..." (input)="filterAdjustments()" />
          </span>
          <p-dropdown [options]="typeOptions" [(ngModel)]="selectedType" placeholder="All Types" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterAdjustments()"></p-dropdown>
          <p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="All Status" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterAdjustments()"></p-dropdown>
          <p-calendar [(ngModel)]="dateRange" selectionMode="range" placeholder="Date Range" [showIcon]="true" dateFormat="dd/mm/yy" (onSelect)="filterAdjustments()"></p-calendar>
        </div>

        <p-table [value]="filteredAdjustments" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Adjustment #</th>
              <th>Date</th>
              <th>Student</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-adj>
            <tr>
              <td><code>{{ adj.adjustmentNo }}</code></td>
              <td>{{ adj.date | date:'dd/MM/yyyy' }}</td>
              <td>
                <div><strong>{{ adj.studentName }}</strong></div>
                <small class="text-muted">{{ adj.admissionNo }} | {{ adj.className }}</small>
              </td>
              <td><p-tag [value]="adj.type" [severity]="getTypeSeverity(adj.type)"></p-tag></td>
              <td class="reason-cell">{{ adj.reason }}</td>
              <td [class]="getAmountClass(adj.type)">
                {{ isDeduction(adj.type) ? '-' : '+' }}₹{{ adj.amount | number }}
              </td>
              <td><p-tag [value]="adj.status" [severity]="getStatusSeverity(adj.status)"></p-tag></td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View" (click)="viewAdjustment(adj)"></button>
                <button pButton icon="pi pi-print" class="p-button-text p-button-sm" pTooltip="Print"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8" class="text-center p-4">No adjustments found</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- View Dialog -->
      <p-dialog [(visible)]="showViewDialog" [header]="'Adjustment Details'" [modal]="true" [style]="{width:'500px'}">
        <div class="detail-view" *ngIf="selectedAdjustment">
          <div class="detail-row">
            <span class="label">Adjustment No:</span>
            <span class="value"><code>{{ selectedAdjustment.adjustmentNo }}</code></span>
          </div>
          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">{{ selectedAdjustment.date | date:'dd MMM yyyy' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Student:</span>
            <span class="value">{{ selectedAdjustment.studentName }} ({{ selectedAdjustment.admissionNo }})</span>
          </div>
          <div class="detail-row">
            <span class="label">Class:</span>
            <span class="value">{{ selectedAdjustment.className }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Type:</span>
            <span class="value"><p-tag [value]="selectedAdjustment.type" [severity]="getTypeSeverity(selectedAdjustment.type)"></p-tag></span>
          </div>
          <div class="detail-row">
            <span class="label">Amount:</span>
            <span class="value" [class]="getAmountClass(selectedAdjustment.type)">{{ isDeduction(selectedAdjustment.type) ? '-' : '+' }}₹{{ selectedAdjustment.amount | number }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Reason:</span>
            <span class="value">{{ selectedAdjustment.reason }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="value"><p-tag [value]="selectedAdjustment.status" [severity]="getStatusSeverity(selectedAdjustment.status)"></p-tag></span>
          </div>
          <div class="detail-row">
            <span class="label">Created By:</span>
            <span class="value">{{ selectedAdjustment.createdBy }}</span>
          </div>
          <div class="detail-row" *ngIf="selectedAdjustment.approvedBy">
            <span class="label">Approved By:</span>
            <span class="value">{{ selectedAdjustment.approvedBy }} on {{ selectedAdjustment.approvalDate | date:'dd MMM yyyy' }}</span>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
    styles: [`
    .adjustment-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { display: flex; align-items: center; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .summary-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-card.pending .summary-icon { background: #fef3c7; color: #f59e0b; }
    .summary-card.approved .summary-icon { background: #d1fae5; color: #10b981; }
    .summary-card.discount .summary-icon { background: #dbeafe; color: #3b82f6; }
    .summary-card.penalty .summary-icon { background: #fee2e2; color: #ef4444; }
    .summary-content { display: flex; flex-direction: column; }
    .summary-content .value { font-size: 1.5rem; font-weight: 700; }
    .summary-content .label { font-size: 0.875rem; color: var(--text-color-secondary); }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
    .text-muted { color: var(--text-color-secondary); }
    .text-center { text-align: center; }
    .reason-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .amount-positive { color: #ef4444; font-weight: 600; }
    .amount-negative { color: #10b981; font-weight: 600; }

    .detail-view { display: flex; flex-direction: column; gap: 1rem; }
    .detail-row { display: flex; gap: 1rem; }
    .detail-row .label { min-width: 120px; color: var(--text-color-secondary); font-size: 0.875rem; }
    .detail-row .value { font-weight: 500; }

    @media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class AdjustmentListComponent implements OnInit {
    searchQuery = '';
    selectedType = '';
    selectedStatus = '';
    dateRange: Date[] = [];
    showViewDialog = false;
    selectedAdjustment: Adjustment | null = null;

    typeOptions = [
        { label: 'Discount', value: 'DISCOUNT' },
        { label: 'Waiver', value: 'WAIVER' },
        { label: 'Penalty', value: 'PENALTY' },
        { label: 'Refund', value: 'REFUND' }
    ];

    statusOptions = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' }
    ];

    adjustments: Adjustment[] = [];
    filteredAdjustments: Adjustment[] = [];

    ngOnInit(): void {
        this.loadAdjustments();
    }

    loadAdjustments(): void {
        this.adjustments = [
            { id: '1', adjustmentNo: 'ADJ-2026-0001', date: new Date(), studentName: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10-A', type: 'DISCOUNT', reason: 'Sibling discount - 10%', amount: 7200, status: 'APPROVED', createdBy: 'Admin', approvedBy: 'Principal', approvalDate: new Date() },
            { id: '2', adjustmentNo: 'ADJ-2026-0002', date: new Date(), studentName: 'Priya Patel', admissionNo: 'ADM2024002', className: 'Class 8-B', type: 'WAIVER', reason: 'Merit scholarship - Full tuition', amount: 24000, status: 'APPROVED', createdBy: 'Admin', approvedBy: 'Director', approvalDate: new Date() },
            { id: '3', adjustmentNo: 'ADJ-2026-0003', date: new Date(), studentName: 'Amit Kumar', admissionNo: 'ADM2024003', className: 'Class 12-A', type: 'PENALTY', reason: 'Late payment fee - Q3', amount: 500, status: 'APPROVED', createdBy: 'System', approvedBy: 'System', approvalDate: new Date() },
            { id: '4', adjustmentNo: 'ADJ-2026-0004', date: new Date(), studentName: 'Sneha Gupta', admissionNo: 'ADM2024004', className: 'Class 10-A', type: 'DISCOUNT', reason: 'Staff ward concession - 25%', amount: 18000, status: 'PENDING', createdBy: 'Front Desk' },
            { id: '5', adjustmentNo: 'ADJ-2026-0005', date: new Date(), studentName: 'Vikram Singh', admissionNo: 'ADM2024005', className: 'Class 10-B', type: 'REFUND', reason: 'Excess payment refund', amount: 5000, status: 'PENDING', createdBy: 'Accountant' }
        ];
        this.filteredAdjustments = [...this.adjustments];
    }

    filterAdjustments(): void {
        this.filteredAdjustments = this.adjustments.filter(adj => {
            const matchSearch = !this.searchQuery || adj.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) || adj.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchType = !this.selectedType || adj.type === this.selectedType;
            const matchStatus = !this.selectedStatus || adj.status === this.selectedStatus;
            return matchSearch && matchType && matchStatus;
        });
    }

    getPendingCount(): number { return this.adjustments.filter(a => a.status === 'PENDING').length; }
    getApprovedCount(): number { return this.adjustments.filter(a => a.status === 'APPROVED').length; }
    getTotalDiscounts(): number { return this.adjustments.filter(a => (a.type === 'DISCOUNT' || a.type === 'WAIVER') && a.status === 'APPROVED').reduce((sum, a) => sum + a.amount, 0); }
    getTotalPenalties(): number { return this.adjustments.filter(a => a.type === 'PENALTY' && a.status === 'APPROVED').reduce((sum, a) => sum + a.amount, 0); }

    isDeduction(type: string): boolean { return type === 'DISCOUNT' || type === 'WAIVER' || type === 'REFUND'; }
    getAmountClass(type: string): string { return this.isDeduction(type) ? 'amount-negative' : 'amount-positive'; }

    getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = { 'DISCOUNT': 'info', 'WAIVER': 'success', 'PENALTY': 'danger', 'REFUND': 'warn' };
        return map[type] || 'info';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = { 'APPROVED': 'success', 'PENDING': 'warn', 'REJECTED': 'danger' };
        return map[status] || 'info';
    }

    viewAdjustment(adj: Adjustment): void {
        this.selectedAdjustment = adj;
        this.showViewDialog = true;
    }
}
