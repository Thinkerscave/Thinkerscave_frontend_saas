import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-receipt-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, CalendarModule, TooltipModule],
    template: `
    <div class="receipt-list">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-file"></i> Fee Receipts</h2>
          <p>View and manage all fee receipts</p>
        </div>
      </div>

      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search receipt or student..." />
          </span>
          <p-calendar [(ngModel)]="dateRange" selectionMode="range" placeholder="Date Range" [showIcon]="true" dateFormat="dd/mm/yy"></p-calendar>
        </div>

        <p-table [value]="receipts" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Receipt #</th>
              <th>Date</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr>
              <td><code>{{ r.receiptNo }}</code></td>
              <td>{{ r.date | date:'dd/MM/yyyy' }}</td>
              <td>
                <div><strong>{{ r.studentName }}</strong></div>
                <small class="text-muted">{{ r.admissionNo }}</small>
              </td>
              <td class="amount">₹{{ r.amount | number }}</td>
              <td><p-tag [value]="r.mode" severity="info"></p-tag></td>
              <td><p-tag [value]="r.status" [severity]="r.status === 'VALID' ? 'success' : 'danger'"></p-tag></td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" [routerLink]="['view', r.id]" pTooltip="View"></button>
                <button pButton icon="pi pi-print" class="p-button-text p-button-sm" pTooltip="Print"></button>
                <button pButton icon="pi pi-download" class="p-button-text p-button-sm" pTooltip="Download"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
    styles: [`
    .receipt-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
    .amount { color: #10b981; font-weight: 600; }
    .text-muted { color: var(--text-color-secondary); }
  `]
})
export class ReceiptListComponent {
    searchQuery = '';
    dateRange: Date[] = [];

    receipts = [
        { id: '1', receiptNo: 'RCP-2026-0001', date: new Date(), studentName: 'Rahul Sharma', admissionNo: 'ADM2024001', amount: 18000, mode: 'Cash', status: 'VALID' },
        { id: '2', receiptNo: 'RCP-2026-0002', date: new Date(), studentName: 'Priya Patel', admissionNo: 'ADM2024002', amount: 16250, mode: 'UPI', status: 'VALID' },
        { id: '3', receiptNo: 'RCP-2026-0003', date: new Date(), studentName: 'Amit Kumar', admissionNo: 'ADM2024003', amount: 21250, mode: 'Card', status: 'VALID' },
        { id: '4', receiptNo: 'RCP-2025-0999', date: new Date('2025-12-15'), studentName: 'Vikram Singh', admissionNo: 'ADM2024005', amount: 18000, mode: 'Cheque', status: 'CANCELLED' }
    ];
}
