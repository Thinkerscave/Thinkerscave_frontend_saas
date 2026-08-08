import { Component, ChangeDetectionStrategy } from '@angular/core';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, DropdownModule, CalendarModule, TooltipModule],
    template: `
    <div class="payment-history">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-history"></i> Payment History</h2>
          <p>View all payment transactions</p>
        </div>
        <div class="header-actions">
          <div class="tc-view-switch" role="group" aria-label="View mode">
            <button type="button" [class.is-active]="view === 'timeline'" (click)="view = 'timeline'" title="Timeline view"><i class="pi pi-sitemap"></i></button>
            <button type="button" [class.is-active]="view === 'table'" (click)="view = 'table'" title="Table view"><i class="pi pi-list"></i></button>
          </div>
          <button pButton label="Export" icon="pi pi-download" class="p-button-outlined"></button>
        </div>
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

        <ol *ngIf="view === 'timeline'" class="payment-timeline">
          <li *ngFor="let p of payments" class="payment-timeline__item">
            <span class="payment-timeline__dot"></span>
            <div class="payment-timeline__card">
              <div class="payment-timeline__top">
                <div>
                  <strong>{{ p.studentName }}</strong>
                  <small>{{ p.className }}</small>
                </div>
                <span class="amount">₹{{ p.amount | number }}</span>
              </div>
              <div class="payment-timeline__meta">
                <code>{{ p.receiptNo }}</code>
                <p-tag [value]="p.mode" severity="info"></p-tag>
                <span>{{ p.date | date:'dd/MM/yyyy HH:mm' }}</span>
                <span>by {{ p.collectedBy }}</span>
              </div>
            </div>
          </li>
        </ol>

        <p-table *ngIf="view === 'table'" [value]="payments" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
    .amount { color: #10b981; font-weight: 600; font-size: 1.1rem; }
    .payment-timeline { list-style: none; margin: 0; padding: 0; }
    .payment-timeline__item {
      position: relative;
      display: grid;
      grid-template-columns: 18px 1fr;
      gap: 12px;
      padding-bottom: 1rem;
    }
    .payment-timeline__item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 16px;
      bottom: 0;
      width: 2px;
      background: color-mix(in srgb, var(--tc-accent, var(--primary-color)) 25%, var(--surface-border));
    }
    .payment-timeline__dot {
      width: 16px;
      height: 16px;
      margin-top: 6px;
      border-radius: 50%;
      background: var(--tc-accent, var(--primary-color));
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--tc-accent, var(--primary-color)) 16%, transparent);
    }
    .payment-timeline__card {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 0.9rem 1rem;
    }
    .payment-timeline__top { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .payment-timeline__top small { display: block; color: var(--text-color-secondary); margin-top: 0.15rem; }
    .payment-timeline__meta { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-top: 0.65rem; color: var(--text-color-secondary); font-size: 0.85rem; }
  `]
})
export class PaymentHistoryComponent {
    view: 'timeline' | 'table' = 'timeline';
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
        { id: '2', receiptNo: 'RCP-2026-0002', date: new Date(Date.now() - 86400000), studentName: 'Priya Patel', className: 'Class 8-B', amount: 16250, mode: 'UPI', collectedBy: 'Front Desk' },
        { id: '3', receiptNo: 'RCP-2026-0003', date: new Date(Date.now() - 172800000), studentName: 'Amit Kumar', className: 'Class 12-A', amount: 21250, mode: 'CARD', collectedBy: 'Admin' },
        { id: '4', receiptNo: 'RCP-2026-0004', date: new Date(Date.now() - 259200000), studentName: 'Sneha Gupta', className: 'Class 10-A', amount: 18000, mode: 'CHEQUE', collectedBy: 'Accountant' }
    ];
}
