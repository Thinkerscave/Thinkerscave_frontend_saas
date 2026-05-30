import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';

interface PaymentRecord {
    id: string;
    date: Date;
    receiptNo: string;
    amount: number;
    feeHeads: string[];
    paymentMode: string;
    transactionRef: string;
    status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
    academicYear: string;
}

@Component({
    selector: 'app-portal-payment-history',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, TagModule, CalendarModule, DropdownModule, TooltipModule, DialogModule],
    template: `
    <div class="payment-history">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-history"></i> Payment History</h2>
          <p>View all your past payment transactions</p>
        </div>
        <div class="header-actions">
          <button pButton label="Download Statement" icon="pi pi-download" class="p-button-outlined" (click)="downloadStatement()"></button>
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card total-paid">
          <div class="card-icon"><i class="pi pi-check-circle"></i></div>
          <div class="card-content">
            <span class="label">Total Paid</span>
            <span class="value">₹{{ totalPaid | number }}</span>
          </div>
        </div>
        <div class="summary-card transactions">
          <div class="card-icon"><i class="pi pi-list"></i></div>
          <div class="card-content">
            <span class="label">Transactions</span>
            <span class="value">{{ totalTransactions }}</span>
          </div>
        </div>
        <div class="summary-card this-year">
          <div class="card-icon"><i class="pi pi-calendar"></i></div>
          <div class="card-content">
            <span class="label">This Year</span>
            <span class="value">₹{{ thisYearPaid | number }}</span>
          </div>
        </div>
        <div class="summary-card last-payment">
          <div class="card-icon"><i class="pi pi-clock"></i></div>
          <div class="card-content">
            <span class="label">Last Payment</span>
            <span class="value">{{ lastPaymentDate | date:'dd MMM yyyy' }}</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-item">
            <label>Date Range</label>
            <p-calendar [(ngModel)]="dateRange" selectionMode="range" dateFormat="dd/mm/yy" [showIcon]="true" placeholder="Select dates" (onSelect)="filterPayments()"></p-calendar>
          </div>
          <div class="filter-item">
            <label>Academic Year</label>
            <p-dropdown [options]="yearOptions" [(ngModel)]="selectedYear" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Years" (onChange)="filterPayments()"></p-dropdown>
          </div>
          <div class="filter-item">
            <label>Payment Mode</label>
            <p-dropdown [options]="modeOptions" [(ngModel)]="selectedMode" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Modes" (onChange)="filterPayments()"></p-dropdown>
          </div>
          <div class="filter-item">
            <label>Status</label>
            <p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus" optionLabel="label" optionValue="value" [showClear]="true" placeholder="All Status" (onChange)="filterPayments()"></p-dropdown>
          </div>
          <div class="filter-actions">
            <button pButton label="Clear" icon="pi pi-filter-slash" class="p-button-text" (click)="clearFilters()"></button>
          </div>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="content-card">
        <p-table [value]="filteredPayments" [paginator]="true" [rows]="10" [showCurrentPageReport]="true"
                 currentPageReportTemplate="Showing {first} to {last} of {totalRecords} payments"
                 styleClass="p-datatable-striped" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="date">Date <p-sortIcon field="date"></p-sortIcon></th>
              <th>Receipt No</th>
              <th pSortableColumn="amount">Amount <p-sortIcon field="amount"></p-sortIcon></th>
              <th>Fee Heads</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th style="width:100px">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-payment>
            <tr>
              <td>
                <div class="date-cell">
                  <strong>{{ payment.date | date:'dd MMM yyyy' }}</strong>
                  <small>{{ payment.date | date:'hh:mm a' }}</small>
                </div>
              </td>
              <td><code>{{ payment.receiptNo }}</code></td>
              <td>
                <span class="amount-cell" [class.refunded]="payment.status === 'REFUNDED'">
                  ₹{{ payment.amount | number }}
                </span>
              </td>
              <td>
                <div class="fee-heads">
                  <p-tag *ngFor="let fh of payment.feeHeads.slice(0, 2)" [value]="fh" [style]="{'font-size':'0.7rem','margin':'0.1rem'}"></p-tag>
                  <span *ngIf="payment.feeHeads.length > 2" class="more-tag">+{{ payment.feeHeads.length - 2 }}</span>
                </div>
              </td>
              <td>
                <div class="mode-cell">
                  <i [class]="getModeIcon(payment.paymentMode)"></i>
                  <span>{{ payment.paymentMode }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="payment.status" [severity]="getStatusSeverity(payment.status)"></p-tag>
              </td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" (click)="viewPaymentDetails(payment)"></button>
                <button pButton icon="pi pi-download" class="p-button-text p-button-sm" pTooltip="Download Receipt" (click)="downloadReceipt(payment)" [disabled]="payment.status !== 'SUCCESS'"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="empty-message">
                <i class="pi pi-inbox"></i>
                <p>No payment records found</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Payment Details Dialog -->
      <p-dialog [(visible)]="showDetailsDialog" [header]="'Payment Details'" [modal]="true" [style]="{width:'550px'}">
        <div class="payment-detail-content" *ngIf="selectedPayment">
          <div class="detail-status" [ngClass]="selectedPayment.status.toLowerCase()">
            <i [class]="getStatusIcon(selectedPayment.status)"></i>
            <span>{{ getStatusText(selectedPayment.status) }}</span>
          </div>

          <div class="detail-amount">
            <span class="label">Amount Paid</span>
            <span class="value">₹{{ selectedPayment.amount | number }}</span>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Receipt Number</span>
              <code>{{ selectedPayment.receiptNo }}</code>
            </div>
            <div class="detail-item">
              <span class="label">Payment Date</span>
              <span>{{ selectedPayment.date | date:'dd MMM yyyy, hh:mm a' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Payment Mode</span>
              <span><i [class]="getModeIcon(selectedPayment.paymentMode)"></i> {{ selectedPayment.paymentMode }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Transaction Ref</span>
              <code>{{ selectedPayment.transactionRef || '-' }}</code>
            </div>
            <div class="detail-item">
              <span class="label">Academic Year</span>
              <span>{{ selectedPayment.academicYear }}</span>
            </div>
          </div>

          <div class="fee-heads-section">
            <span class="label">Fee Heads</span>
            <div class="fee-head-list">
              <p-tag *ngFor="let fh of selectedPayment.feeHeads" [value]="fh"></p-tag>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Download Receipt" icon="pi pi-download" class="p-button-outlined"
                  (click)="downloadReceipt(selectedPayment)" [disabled]="selectedPayment?.status !== 'SUCCESS'"></button>
          <button pButton label="Close" (click)="showDetailsDialog = false"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
    styles: [`
    .payment-history { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-card { display: flex; gap: 1rem; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; }
    .card-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .summary-card.total-paid .card-icon { background: #dcfce7; color: #16a34a; }
    .summary-card.transactions .card-icon { background: #dbeafe; color: #2563eb; }
    .summary-card.this-year .card-icon { background: #f3e8ff; color: #9333ea; }
    .summary-card.last-payment .card-icon { background: #fef3c7; color: #d97706; }
    .card-content { display: flex; flex-direction: column; }
    .card-content .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .card-content .value { font-size: 1.5rem; font-weight: 700; }

    .filters-card { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-item label { font-size: 0.875rem; font-weight: 500; color: var(--text-color-secondary); }
    .filter-actions { margin-left: auto; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }

    .date-cell { display: flex; flex-direction: column; }
    .date-cell small { color: var(--text-color-secondary); font-size: 0.75rem; }

    code { background: var(--surface-ground); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-family: monospace; }

    .amount-cell { font-size: 1rem; font-weight: 600; color: #16a34a; }
    .amount-cell.refunded { text-decoration: line-through; color: var(--text-color-secondary); }

    .fee-heads { display: flex; flex-wrap: wrap; gap: 0.25rem; align-items: center; }
    .more-tag { font-size: 0.75rem; color: var(--text-color-secondary); margin-left: 0.25rem; }

    .mode-cell { display: flex; align-items: center; gap: 0.5rem; }
    .mode-cell i { color: var(--primary-color); }

    .empty-message { text-align: center; padding: 3rem !important; color: var(--text-color-secondary); }
    .empty-message i { font-size: 2.5rem; margin-bottom: 1rem; display: block; }
    .empty-message p { margin: 0; }

    .payment-detail-content { display: flex; flex-direction: column; gap: 1.5rem; }

    .detail-status { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 1rem; border-radius: 10px; font-weight: 600; }
    .detail-status.success { background: #dcfce7; color: #16a34a; }
    .detail-status.pending { background: #fef3c7; color: #d97706; }
    .detail-status.failed { background: #fee2e2; color: #dc2626; }
    .detail-status.refunded { background: #e0e7ff; color: #4f46e5; }
    .detail-status i { font-size: 1.25rem; }

    .detail-amount { text-align: center; padding: 1rem; background: var(--surface-ground); border-radius: 10px; }
    .detail-amount .label { display: block; font-size: 0.875rem; color: var(--text-color-secondary); margin-bottom: 0.5rem; }
    .detail-amount .value { font-size: 2rem; font-weight: 700; color: #16a34a; }

    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem; background: var(--surface-ground); border-radius: 8px; }
    .detail-item .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .detail-item span { display: flex; align-items: center; gap: 0.35rem; }

    .fee-heads-section { padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .fee-heads-section .label { display: block; font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; margin-bottom: 0.75rem; }
    .fee-head-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .filters-row { flex-direction: column; align-items: stretch; }
      .filter-actions { margin-left: 0; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PortalPaymentHistoryComponent implements OnInit {
    dateRange: Date[] | null = null;
    selectedYear = '';
    selectedMode = '';
    selectedStatus = '';
    showDetailsDialog = false;
    selectedPayment: PaymentRecord | null = null;

    totalPaid = 104500;
    totalTransactions = 8;
    thisYearPaid = 36000;
    lastPaymentDate = new Date('2025-07-12');

    yearOptions = [
        { label: '2025-26', value: '2025-26' },
        { label: '2024-25', value: '2024-25' },
        { label: '2023-24', value: '2023-24' }
    ];

    modeOptions = [
        { label: 'Online', value: 'Online' },
        { label: 'Cash', value: 'Cash' },
        { label: 'Cheque', value: 'Cheque' },
        { label: 'UPI', value: 'UPI' }
    ];

    statusOptions = [
        { label: 'Success', value: 'SUCCESS' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Failed', value: 'FAILED' },
        { label: 'Refunded', value: 'REFUNDED' }
    ];

    payments: PaymentRecord[] = [];
    filteredPayments: PaymentRecord[] = [];

    ngOnInit(): void {
        this.loadPayments();
    }

    loadPayments(): void {
        this.payments = [
            { id: '1', date: new Date('2025-07-12T10:30:00'), receiptNo: 'RCP-2025-0234', amount: 18000, feeHeads: ['Tuition Fee', 'Lab Fee'], paymentMode: 'Online', transactionRef: 'TXN789012345', status: 'SUCCESS', academicYear: '2025-26' },
            { id: '2', date: new Date('2025-04-10T14:15:00'), receiptNo: 'RCP-2025-0089', amount: 18000, feeHeads: ['Tuition Fee', 'Transport Fee', 'Library Fee'], paymentMode: 'Cash', transactionRef: '', status: 'SUCCESS', academicYear: '2025-26' },
            { id: '3', date: new Date('2025-01-08T11:00:00'), receiptNo: 'RCP-2025-0012', amount: 17500, feeHeads: ['Tuition Fee', 'Sports Fee'], paymentMode: 'UPI', transactionRef: 'UPI456789012', status: 'SUCCESS', academicYear: '2024-25' },
            { id: '4', date: new Date('2024-10-15T09:45:00'), receiptNo: 'RCP-2024-0456', amount: 17000, feeHeads: ['Tuition Fee', 'Lab Fee'], paymentMode: 'Online', transactionRef: 'TXN456123789', status: 'SUCCESS', academicYear: '2024-25' },
            { id: '5', date: new Date('2024-07-20T16:30:00'), receiptNo: 'RCP-2024-0234', amount: 17000, feeHeads: ['Tuition Fee', 'Transport Fee'], paymentMode: 'Cheque', transactionRef: 'CHQ-123456', status: 'SUCCESS', academicYear: '2024-25' },
            { id: '6', date: new Date('2024-04-05T10:00:00'), receiptNo: 'RCP-2024-0045', amount: 17000, feeHeads: ['Tuition Fee'], paymentMode: 'Cash', transactionRef: '', status: 'SUCCESS', academicYear: '2024-25' },
            { id: '7', date: new Date('2024-03-28T12:30:00'), receiptNo: '-', amount: 5000, feeHeads: ['Admission Fee'], paymentMode: 'Online', transactionRef: 'TXN111222333', status: 'FAILED', academicYear: '2024-25' },
            { id: '8', date: new Date('2024-01-15T14:00:00'), receiptNo: 'RCP-2024-0005', amount: 2000, feeHeads: ['Sports Fee'], paymentMode: 'UPI', transactionRef: 'UPI987654321', status: 'REFUNDED', academicYear: '2023-24' }
        ];
        this.filteredPayments = [...this.payments];
    }

    filterPayments(): void {
        this.filteredPayments = this.payments.filter(payment => {
            const matchYear = !this.selectedYear || payment.academicYear === this.selectedYear;
            const matchMode = !this.selectedMode || payment.paymentMode === this.selectedMode;
            const matchStatus = !this.selectedStatus || payment.status === this.selectedStatus;
            return matchYear && matchMode && matchStatus;
        });
    }

    clearFilters(): void {
        this.dateRange = null;
        this.selectedYear = '';
        this.selectedMode = '';
        this.selectedStatus = '';
        this.filteredPayments = [...this.payments];
    }

    getModeIcon(mode: string): string {
        const icons: Record<string, string> = {
            'Online': 'pi pi-globe',
            'Cash': 'pi pi-wallet',
            'Cheque': 'pi pi-file',
            'UPI': 'pi pi-mobile'
        };
        return icons[mode] || 'pi pi-credit-card';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            'SUCCESS': 'success',
            'PENDING': 'warn',
            'FAILED': 'danger',
            'REFUNDED': 'info'
        };
        return map[status] || 'info';
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            'SUCCESS': 'pi pi-check-circle',
            'PENDING': 'pi pi-clock',
            'FAILED': 'pi pi-times-circle',
            'REFUNDED': 'pi pi-refresh'
        };
        return icons[status] || 'pi pi-info-circle';
    }

    getStatusText(status: string): string {
        const texts: Record<string, string> = {
            'SUCCESS': 'Payment Successful',
            'PENDING': 'Payment Pending',
            'FAILED': 'Payment Failed',
            'REFUNDED': 'Amount Refunded'
        };
        return texts[status] || status;
    }

    viewPaymentDetails(payment: PaymentRecord): void {
        this.selectedPayment = payment;
        this.showDetailsDialog = true;
    }

    downloadReceipt(payment: PaymentRecord | null): void {
        if (payment) {
            // Download receipt logic
        }
    }

    downloadStatement(): void {
        // Download statement logic
    }
}
