import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

interface PendingAdjustment {
  id: string;
  adjustmentNo: string;
  date: Date;
  studentName: string;
  admissionNo: string;
  className: string;
  type: 'DISCOUNT' | 'WAIVER' | 'PENALTY' | 'REFUND';
  category?: string;
  reason: string;
  amount: number;
  percentageValue?: number;
  createdBy: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, InputTextarea, DropdownModule, DialogModule, TooltipModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="pending-approvals">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <div class="page-header">
        <div>
          <h2><i class="pi pi-check-circle"></i> Pending Approvals</h2>
          <p>Review and approve/reject adjustment requests</p>
        </div>
        <button pButton label="Back to Adjustments" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card urgent">
          <div class="stat-icon"><i class="pi pi-exclamation-circle"></i></div>
          <div class="stat-info">
            <span class="value">{{ getHighPriorityCount() }}</span>
            <span class="label">High Priority</span>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon"><i class="pi pi-clock"></i></div>
          <div class="stat-info">
            <span class="value">{{ pendingAdjustments.length }}</span>
            <span class="label">Total Pending</span>
          </div>
        </div>
        <div class="stat-card amount">
          <div class="stat-icon"><i class="pi pi-indian-rupee"></i></div>
          <div class="stat-info">
            <span class="value">₹{{ getTotalAmount() | number }}</span>
            <span class="label">Total Value</span>
          </div>
        </div>
      </div>

      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search..." (input)="filterAdjustments()" />
          </span>
          <p-dropdown [options]="typeOptions" [(ngModel)]="selectedType" placeholder="All Types" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterAdjustments()"></p-dropdown>
          <p-dropdown [options]="priorityOptions" [(ngModel)]="selectedPriority" placeholder="All Priority" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterAdjustments()"></p-dropdown>
          <div class="bulk-actions" *ngIf="selectedAdjustments.length > 0">
            <span class="selected-count">{{ selectedAdjustments.length }} selected</span>
            <button pButton label="Approve All" icon="pi pi-check" class="p-button-success p-button-sm" (click)="bulkApprove()"></button>
            <button pButton label="Reject All" icon="pi pi-times" class="p-button-danger p-button-sm" (click)="bulkReject()"></button>
          </div>
        </div>

        <p-table [value]="filteredAdjustments" [(selection)]="selectedAdjustments" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:50px"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
              <th>Request Details</th>
              <th>Student</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Priority</th>
              <th style="width:200px">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-adj>
            <tr>
              <td><p-tableCheckbox [value]="adj"></p-tableCheckbox></td>
              <td>
                <div class="request-info">
                  <code>{{ adj.adjustmentNo }}</code>
                  <small>{{ adj.date | date:'dd MMM yyyy' }}</small>
                  <small class="created-by">by {{ adj.createdBy }}</small>
                </div>
              </td>
              <td>
                <div class="student-info">
                  <strong>{{ adj.studentName }}</strong>
                  <small>{{ adj.admissionNo }} | {{ adj.className }}</small>
                </div>
              </td>
              <td>
                <div class="type-info">
                  <p-tag [value]="adj.type" [severity]="getTypeSeverity(adj.type)"></p-tag>
                  <small *ngIf="adj.category" class="category">{{ adj.category }}</small>
                </div>
              </td>
              <td>
                <div class="amount-info">
                  <span class="amount" [class]="getAmountClass(adj.type)">
                    {{ isDeduction(adj.type) ? '-' : '+' }}₹{{ adj.amount | number }}
                  </span>
                  <small *ngIf="adj.percentageValue">({{ adj.percentageValue }}%)</small>
                </div>
              </td>
              <td><p-tag [value]="adj.priority" [severity]="getPrioritySeverity(adj.priority)"></p-tag></td>
              <td>
                <div class="action-buttons">
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" (click)="viewDetails(adj)"></button>
                  <button pButton icon="pi pi-check" class="p-button-success p-button-sm" pTooltip="Approve" (click)="approve(adj)"></button>
                  <button pButton icon="pi pi-times" class="p-button-danger p-button-sm" pTooltip="Reject" (click)="openRejectDialog(adj)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <h4>All Caught Up!</h4>
                  <p>No pending approvals at this time</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- View Details Dialog -->
      <p-dialog [(visible)]="showDetailsDialog" [header]="'Adjustment Details'" [modal]="true" [style]="{width:'600px'}">
        <div class="detail-content" *ngIf="selectedForView">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Request No</span>
              <span class="value"><code>{{ selectedForView.adjustmentNo }}</code></span>
            </div>
            <div class="detail-item">
              <span class="label">Date</span>
              <span class="value">{{ selectedForView.date | date:'dd MMM yyyy, HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Student</span>
              <span class="value">{{ selectedForView.studentName }} ({{ selectedForView.admissionNo }})</span>
            </div>
            <div class="detail-item">
              <span class="label">Class</span>
              <span class="value">{{ selectedForView.className }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Type</span>
              <span class="value"><p-tag [value]="selectedForView.type" [severity]="getTypeSeverity(selectedForView.type)"></p-tag></span>
            </div>
            <div class="detail-item">
              <span class="label">Amount</span>
              <span class="value amount-lg" [class]="getAmountClass(selectedForView.type)">
                {{ isDeduction(selectedForView.type) ? '-' : '+' }}₹{{ selectedForView.amount | number }}
              </span>
            </div>
          </div>
          <div class="reason-box">
            <span class="label">Reason / Justification</span>
            <p>{{ selectedForView.reason }}</p>
          </div>
          <div class="detail-footer">
            <span>Requested by: <strong>{{ selectedForView.createdBy }}</strong></span>
            <p-tag [value]="selectedForView.priority + ' Priority'" [severity]="getPrioritySeverity(selectedForView.priority)"></p-tag>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Reject" icon="pi pi-times" class="p-button-danger" (click)="openRejectDialog(selectedForView!)"></button>
          <button pButton label="Approve" icon="pi pi-check" class="p-button-success" (click)="approve(selectedForView!)"></button>
        </ng-template>
      </p-dialog>

      <!-- Reject Dialog -->
      <p-dialog [(visible)]="showRejectDialog" [header]="'Reject Adjustment'" [modal]="true" [style]="{width:'450px'}">
        <div class="reject-form">
          <p class="reject-warning">
            <i class="pi pi-exclamation-triangle"></i>
            You are about to reject adjustment <strong>{{ selectedForReject?.adjustmentNo }}</strong>
          </p>
          <div class="form-field">
            <label>Rejection Reason *</label>
            <textarea pInputTextarea [(ngModel)]="rejectionReason" [rows]="3" placeholder="Enter reason for rejection..."></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showRejectDialog = false"></button>
          <button pButton label="Confirm Rejection" icon="pi pi-times" class="p-button-danger" [disabled]="!rejectionReason.trim()" (click)="confirmReject()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .pending-approvals { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { display: flex; align-items: center; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.urgent .stat-icon { background: #fee2e2; color: #ef4444; }
    .stat-card.pending .stat-icon { background: #fef3c7; color: #f59e0b; }
    .stat-card.amount .stat-icon { background: #dbeafe; color: #3b82f6; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-info .value { font-size: 1.5rem; font-weight: 700; }
    .stat-info .label { font-size: 0.875rem; color: var(--text-color-secondary); }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
    .bulk-actions { margin-left: auto; display: flex; align-items: center; gap: 0.75rem; }
    .selected-count { font-weight: 500; color: var(--primary-color); }

    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; }
    .request-info, .student-info, .type-info, .amount-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .created-by { color: var(--text-color-secondary); font-style: italic; }
    .category { color: var(--text-color-secondary); }
    .amount { font-weight: 600; font-size: 1.1rem; }
    .amount.deduction { color: #10b981; }
    .amount.addition { color: #ef4444; }

    .action-buttons { display: flex; gap: 0.25rem; }
    .text-center { text-align: center; }

    .empty-state { padding: 2rem; text-align: center; }
    .empty-state i { font-size: 3rem; color: #10b981; margin-bottom: 1rem; }
    .empty-state h4 { margin: 0 0 0.5rem; color: #10b981; }
    .empty-state p { margin: 0; color: var(--text-color-secondary); }

    .detail-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .detail-item .value { font-weight: 500; }
    .amount-lg { font-size: 1.5rem; }
    .reason-box { background: var(--surface-ground); padding: 1rem; border-radius: 8px; }
    .reason-box .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
    .reason-box p { margin: 0; }
    .detail-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--surface-border); }

    .reject-form { display: flex; flex-direction: column; gap: 1rem; }
    .reject-warning { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #fef3c7; border-radius: 8px; color: #92400e; }
    .reject-warning i { font-size: 1.25rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field label { font-weight: 500; }
    .form-field textarea { width: 100%; }

    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class PendingApprovalsComponent implements OnInit {
  searchQuery = '';
  selectedType = '';
  selectedPriority = '';
  showDetailsDialog = false;
  showRejectDialog = false;
  rejectionReason = '';
  selectedForView: PendingAdjustment | null = null;
  selectedForReject: PendingAdjustment | null = null;
  selectedAdjustments: PendingAdjustment[] = [];

  typeOptions = [
    { label: 'Discount', value: 'DISCOUNT' },
    { label: 'Waiver', value: 'WAIVER' },
    { label: 'Penalty', value: 'PENALTY' },
    { label: 'Refund', value: 'REFUND' }
  ];

  priorityOptions = [
    { label: 'High', value: 'HIGH' },
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Low', value: 'LOW' }
  ];

  pendingAdjustments: PendingAdjustment[] = [];
  filteredAdjustments: PendingAdjustment[] = [];

  constructor(private messageService: MessageService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loadPendingAdjustments();
  }

  loadPendingAdjustments(): void {
    this.pendingAdjustments = [
      { id: '1', adjustmentNo: 'ADJ-2026-0004', date: new Date(), studentName: 'Sneha Gupta', admissionNo: 'ADM2024004', className: 'Class 10-A', type: 'DISCOUNT', category: 'Staff Ward', reason: 'Staff ward concession - Father is a faculty member in the Science department. As per policy, 25% discount applicable on tuition fees.', amount: 18000, percentageValue: 25, createdBy: 'Front Desk', priority: 'HIGH' },
      { id: '2', adjustmentNo: 'ADJ-2026-0005', date: new Date(), studentName: 'Vikram Singh', admissionNo: 'ADM2024005', className: 'Class 10-B', type: 'REFUND', reason: 'Excess payment made during Q2 fee collection. Amount to be refunded to parent bank account.', amount: 5000, createdBy: 'Accountant', priority: 'NORMAL' },
      { id: '3', adjustmentNo: 'ADJ-2026-0006', date: new Date(Date.now() - 86400000), studentName: 'Anjali Verma', admissionNo: 'ADM2024006', className: 'Class 8-A', type: 'WAIVER', category: 'Financial Aid', reason: 'Family facing financial hardship. Request for partial fee waiver based on income certificate submitted.', amount: 12000, createdBy: 'Admin', priority: 'HIGH' },
      { id: '4', adjustmentNo: 'ADJ-2026-0007', date: new Date(Date.now() - 172800000), studentName: 'Rohan Mehta', admissionNo: 'ADM2024007', className: 'Class 12-A', type: 'DISCOUNT', category: 'Merit', reason: 'School topper in Class 11 final exams. 15% merit scholarship as per academic excellence policy.', amount: 12750, percentageValue: 15, createdBy: 'Principal Office', priority: 'NORMAL' }
    ];
    this.filteredAdjustments = [...this.pendingAdjustments];
  }

  filterAdjustments(): void {
    this.filteredAdjustments = this.pendingAdjustments.filter(adj => {
      const matchSearch = !this.searchQuery || adj.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) || adj.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchType = !this.selectedType || adj.type === this.selectedType;
      const matchPriority = !this.selectedPriority || adj.priority === this.selectedPriority;
      return matchSearch && matchType && matchPriority;
    });
  }

  getHighPriorityCount(): number { return this.pendingAdjustments.filter(a => a.priority === 'HIGH').length; }
  getTotalAmount(): number { return this.pendingAdjustments.reduce((sum, a) => sum + a.amount, 0); }

  isDeduction(type: string): boolean { return type === 'DISCOUNT' || type === 'WAIVER' || type === 'REFUND'; }
  getAmountClass(type: string): string { return this.isDeduction(type) ? 'deduction' : 'addition'; }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = { 'DISCOUNT': 'info', 'WAIVER': 'success', 'PENALTY': 'danger', 'REFUND': 'warn' };
    return map[type] || 'info';
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'warn' | 'danger'> = { 'HIGH': 'danger', 'NORMAL': 'warn', 'LOW': 'success' };
    return map[priority] || 'info';
  }

  viewDetails(adj: PendingAdjustment): void {
    this.selectedForView = adj;
    this.showDetailsDialog = true;
  }

  approve(adj: PendingAdjustment): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to approve adjustment ${adj.adjustmentNo} for ₹${adj.amount.toLocaleString()}?`,
      header: 'Confirm Approval',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.pendingAdjustments = this.pendingAdjustments.filter(a => a.id !== adj.id);
        this.filterAdjustments();
        this.showDetailsDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: `Adjustment ${adj.adjustmentNo} approved successfully`, life: 3000 });
      }
    });
  }

  openRejectDialog(adj: PendingAdjustment): void {
    this.selectedForReject = adj;
    this.rejectionReason = '';
    this.showRejectDialog = true;
    this.showDetailsDialog = false;
  }

  confirmReject(): void {
    if (this.selectedForReject && this.rejectionReason.trim()) {
      this.pendingAdjustments = this.pendingAdjustments.filter(a => a.id !== this.selectedForReject!.id);
      this.filterAdjustments();
      this.showRejectDialog = false;
      this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: `Adjustment ${this.selectedForReject.adjustmentNo} rejected`, life: 3000 });
    }
  }

  bulkApprove(): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to approve ${this.selectedAdjustments.length} adjustments?`,
      header: 'Bulk Approval',
      icon: 'pi pi-check-circle',
      accept: () => {
        const ids = this.selectedAdjustments.map(a => a.id);
        this.pendingAdjustments = this.pendingAdjustments.filter(a => !ids.includes(a.id));
        this.selectedAdjustments = [];
        this.filterAdjustments();
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: `${ids.length} adjustments approved successfully`, life: 3000 });
      }
    });
  }

  bulkReject(): void {
    this.selectedForReject = this.selectedAdjustments[0];
    this.rejectionReason = '';
    this.showRejectDialog = true;
  }
}
