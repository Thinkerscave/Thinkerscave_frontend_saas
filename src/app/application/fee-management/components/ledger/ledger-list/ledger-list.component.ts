import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-ledger-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, DropdownModule, TooltipModule],
    template: `
    <div class="ledger-list">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-book"></i> Fee Ledgers</h2>
          <p>View and manage student fee ledgers</p>
        </div>
      </div>

      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search student..." (input)="filterLedgers()" />
          </span>
          <p-dropdown [options]="classes" [(ngModel)]="selectedClass" placeholder="All Classes" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterLedgers()"></p-dropdown>
          <p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="All Status" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterLedgers()"></p-dropdown>
        </div>

        <p-table [value]="filteredLedgers" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Admission No</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Total Fees</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-ledger>
            <tr>
              <td><code>{{ ledger.admissionNo }}</code></td>
              <td><strong>{{ ledger.studentName }}</strong></td>
              <td>{{ ledger.className }}</td>
              <td>₹{{ ledger.totalFees | number }}</td>
              <td class="text-success">₹{{ ledger.paid | number }}</td>
              <td class="text-danger">₹{{ ledger.outstanding | number }}</td>
              <td><p-tag [value]="ledger.status" [severity]="getStatusSeverity(ledger.status)"></p-tag></td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" [routerLink]="['student', ledger.id]" pTooltip="View Ledger"></button>
                <button pButton icon="pi pi-file" class="p-button-text p-button-sm" pTooltip="Statement"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8" class="text-center p-4">No ledgers found</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
    styles: [`
    .ledger-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
    .text-success { color: #10b981; font-weight: 500; }
    .text-danger { color: #ef4444; font-weight: 500; }
    .text-center { text-align: center; }
  `]
})
export class LedgerListComponent implements OnInit {
    searchQuery = '';
    selectedClass = '';
    selectedStatus = '';

    classes = [
        { label: 'Class 10', value: 'Class 10' },
        { label: 'Class 12', value: 'Class 12' },
        { label: 'Class 8', value: 'Class 8' }
    ];

    statusOptions = [
        { label: 'Current', value: 'CURRENT' },
        { label: 'Overdue', value: 'OVERDUE' },
        { label: 'Cleared', value: 'CLEARED' }
    ];

    ledgers = [
        { id: '1', admissionNo: 'ADM2024001', studentName: 'Rahul Sharma', className: 'Class 10-A', totalFees: 72000, paid: 36000, outstanding: 36000, status: 'OVERDUE' },
        { id: '2', admissionNo: 'ADM2024002', studentName: 'Priya Patel', className: 'Class 8-B', totalFees: 65000, paid: 65000, outstanding: 0, status: 'CLEARED' },
        { id: '3', admissionNo: 'ADM2024003', studentName: 'Amit Kumar', className: 'Class 12-A', totalFees: 85000, paid: 42500, outstanding: 42500, status: 'CURRENT' },
        { id: '4', admissionNo: 'ADM2024004', studentName: 'Sneha Gupta', className: 'Class 10-A', totalFees: 72000, paid: 54000, outstanding: 18000, status: 'CURRENT' }
    ];

    filteredLedgers = [...this.ledgers];

    ngOnInit(): void { }

    filterLedgers(): void {
        this.filteredLedgers = this.ledgers.filter(l => {
            const matchSearch = !this.searchQuery || l.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) || l.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchClass = !this.selectedClass || l.className.includes(this.selectedClass);
            const matchStatus = !this.selectedStatus || l.status === this.selectedStatus;
            return matchSearch && matchClass && matchStatus;
        });
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = { 'CLEARED': 'success', 'CURRENT': 'warn', 'OVERDUE': 'danger' };
        return map[status] || 'info';
    }
}
