import { Component } from '@angular/core';
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

@Component({
    selector: 'app-payment-history',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, DropdownModule, CalendarModule, TooltipModule],
    template: `
    <div class="payment-history">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-history"></i> Payment History</h2>
          <p>View all payment transactions</p>
        </div>
        <button pButton label="Export" icon="pi pi-download" class="p-button-outlined"></button>
      </div>

      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search..." />
          </span>
          <p-calendar [(ngModel)]="dateRange" selectionMode="range" placeholder="Date Range" [showIcon]="true" dateFormat="dd/mm/yy"></p-calendar>
          <p-dropdown [options]="paymentModes" [(ngModel)]="selectedMode" placeholder="All Modes" optionLabel="label" optionValue="value" [showClear]="true"></p-dropdown>
        </div>

        <p-table [value]="payments" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Receipt #</th>
              <th>Date</th>
              <th>Student</th>
              <th>Class</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Collected By</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-p>
            <tr>
              <td><code>{{ p.receiptNo }}</code></td>
              <td>{{ p.date | date:'dd/MM/yyyy HH:mm' }}</td>
              <td><strong>{{ p.studentName }}</strong></td>
              <td>{{ p.className }}</td>
              <td class="amount">₹{{ p.amount | number }}</td>
              <td><p-tag [value]="p.mode" severity="info"></p-tag></td>
              <td>{{ p.collectedBy }}</td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View"></button>
                <button pButton icon="pi pi-print" class="p-button-text p-button-sm" pTooltip="Print"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
    styles: [`
    .payment-history { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
    .amount { color: #10b981; font-weight: 600; font-size: 1.1rem; }
  `]
})
export class PaymentHistoryComponent {
    searchQuery = '';
    dateRange: Date[] = [];
    selectedMode = '';

    paymentModes = [
        { label: 'Cash', value: 'CASH' },
        { label: 'UPI', value: 'UPI' },
        { label: 'Card', value: 'CARD' },
        { label: 'Cheque', value: 'CHEQUE' },
        { label: 'Bank Transfer', value: 'BANK' }
    ];

    payments = [
        { id: '1', receiptNo: 'RCP-2026-0001', date: new Date(), studentName: 'Rahul Sharma', className: 'Class 10-A', amount: 18000, mode: 'CASH', collectedBy: 'Admin' },
        { id: '2', receiptNo: 'RCP-2026-0002', date: new Date(), studentName: 'Priya Patel', className: 'Class 8-B', amount: 16250, mode: 'UPI', collectedBy: 'Front Desk' },
        { id: '3', receiptNo: 'RCP-2026-0003', date: new Date(), studentName: 'Amit Kumar', className: 'Class 12-A', amount: 21250, mode: 'CARD', collectedBy: 'Admin' },
        { id: '4', receiptNo: 'RCP-2026-0004', date: new Date(), studentName: 'Sneha Gupta', className: 'Class 10-A', amount: 18000, mode: 'CHEQUE', collectedBy: 'Accountant' }
    ];
}
