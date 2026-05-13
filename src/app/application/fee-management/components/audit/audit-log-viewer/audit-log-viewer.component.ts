import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'ADJUSTMENT' | 'APPROVAL' | 'EXPORT';
  entityType: string;
  entityId: string;
  entityName: string;
  performedBy: string;
  performedByRole: string;
  ipAddress: string;
  oldValue: any;
  newValue: any;
  description: string;
}

@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, CalendarModule, DropdownModule, InputTextModule, TagModule, TooltipModule, DialogModule],
  template: `
    <div class="audit-log-viewer">
      <div class="page-header">
        <div>
          <h2><i class="pi pi-history"></i> Audit Logs</h2>
          <p>Complete audit trail of all fee operations (read-only)</p>
        </div>
        <div class="header-actions">
          <button pButton label="Export Logs" icon="pi pi-download" class="p-button-outlined" (click)="exportLogs()"></button>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-shield"></i>
        <div>
          <strong>Immutable Audit Trail</strong>
          <p>All logs are read-only and cannot be modified or deleted. This ensures complete compliance and accountability.</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-item">
            <label>Date Range</label>
            <p-calendar [(ngModel)]="dateRange" selectionMode="range" dateFormat="dd/mm/yy" [showIcon]="true" placeholder="Select range" (onSelect)="filterLogs()"></p-calendar>
          </div>
          <div class="filter-item">
            <label>Action Type</label>
            <p-dropdown [options]="actionTypeOptions" [(ngModel)]="selectedActionType" placeholder="All Actions" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterLogs()"></p-dropdown>
          </div>
          <div class="filter-item">
            <label>Entity Type</label>
            <p-dropdown [options]="entityTypeOptions" [(ngModel)]="selectedEntityType" placeholder="All Entities" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterLogs()"></p-dropdown>
          </div>
          <div class="filter-item">
            <label>User</label>
            <p-dropdown [options]="userOptions" [(ngModel)]="selectedUser" placeholder="All Users" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterLogs()"></p-dropdown>
          </div>
          <div class="filter-item search">
            <label>Search</label>
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search description..." (input)="filterLogs()" />
            </span>
          </div>
        </div>
        <div class="filters-actions">
          <button pButton label="Clear Filters" icon="pi pi-filter-slash" class="p-button-text" (click)="clearFilters()"></button>
          <span class="results-count">{{ filteredLogs.length }} logs found</span>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="content-card">
        <p-table [value]="filteredLogs" [paginator]="true" [rows]="20" [showCurrentPageReport]="true"
                 currentPageReportTemplate="Showing {first} to {last} of {totalRecords} logs"
                 styleClass="p-datatable-striped" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:160px" pSortableColumn="timestamp">Timestamp <p-sortIcon field="timestamp"></p-sortIcon></th>
              <th style="width:100px">Action</th>
              <th style="width:120px">Entity</th>
              <th>Description</th>
              <th style="width:140px">Performed By</th>
              <th style="width:110px">IP Address</th>
              <th style="width:80px">Details</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-log>
            <tr>
              <td>
                <div class="timestamp-cell">
                  <strong>{{ log.timestamp | date:'dd MMM yyyy' }}</strong>
                  <small>{{ log.timestamp | date:'HH:mm:ss' }}</small>
                </div>
              </td>
              <td>
                <p-tag [value]="log.actionType" [severity]="getActionSeverity(log.actionType)" [style]="{'font-size':'0.7rem'}"></p-tag>
              </td>
              <td>
                <div class="entity-cell">
                  <span>{{ log.entityType }}</span>
                  <small>{{ log.entityId }}</small>
                </div>
              </td>
              <td>
                <div class="description-cell">
                  {{ log.description }}
                  <small *ngIf="log.entityName">{{ log.entityName }}</small>
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <span>{{ log.performedBy }}</span>
                  <small>{{ log.performedByRole }}</small>
                </div>
              </td>
              <td><code>{{ log.ipAddress }}</code></td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" (click)="viewLogDetails(log)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7" class="text-center p-4">No audit logs found matching your criteria</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Log Details Dialog -->
      <p-dialog [(visible)]="showDetailsDialog" [header]="'Audit Log Details'" [modal]="true" [style]="{width:'650px'}">
        <div class="detail-content" *ngIf="selectedLog">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Log ID</span>
              <code>{{ selectedLog.id }}</code>
            </div>
            <div class="detail-item">
              <span class="label">Timestamp</span>
              <span>{{ selectedLog.timestamp | date:'dd MMM yyyy, HH:mm:ss' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Action Type</span>
              <p-tag [value]="selectedLog.actionType" [severity]="getActionSeverity(selectedLog.actionType)"></p-tag>
            </div>
            <div class="detail-item">
              <span class="label">Entity Type</span>
              <span>{{ selectedLog.entityType }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Entity ID</span>
              <code>{{ selectedLog.entityId }}</code>
            </div>
            <div class="detail-item">
              <span class="label">Entity Name</span>
              <span>{{ selectedLog.entityName || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Performed By</span>
              <span>{{ selectedLog.performedBy }} ({{ selectedLog.performedByRole }})</span>
            </div>
            <div class="detail-item">
              <span class="label">IP Address</span>
              <code>{{ selectedLog.ipAddress }}</code>
            </div>
          </div>

          <div class="detail-section">
            <span class="label">Description</span>
            <p class="description-text">{{ selectedLog.description }}</p>
          </div>

          <div class="changes-section" *ngIf="selectedLog.oldValue || selectedLog.newValue">
            <span class="label">Changes</span>
            <div class="changes-grid">
              <div class="change-column old" *ngIf="selectedLog.oldValue">
                <h5>Previous Value</h5>
                <pre>{{ selectedLog.oldValue | json }}</pre>
              </div>
              <div class="change-column new" *ngIf="selectedLog.newValue">
                <h5>New Value</h5>
                <pre>{{ selectedLog.newValue | json }}</pre>
              </div>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="View Entity Trail" icon="pi pi-history" class="p-button-outlined" [routerLink]="['../', 'trail', selectedLog.entityType, selectedLog.entityId]" *ngIf="selectedLog"></button>
          <button pButton label="Close" (click)="showDetailsDialog = false"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .audit-log-viewer { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }

    .info-banner { display: flex; gap: 1rem; padding: 1rem 1.5rem; background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; margin-bottom: 1.5rem; color: #1e40af; }
    .info-banner i { font-size: 1.5rem; margin-top: 0.25rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; font-size: 0.875rem; opacity: 0.9; }

    .filters-card { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-item label { font-size: 0.875rem; font-weight: 500; color: var(--text-color-secondary); }
    .filter-item.search { flex: 1; min-width: 200px; }
    .filters-actions { display: flex; justify-content: space-between; align-items: center; }
    .results-count { font-size: 0.875rem; color: var(--text-color-secondary); }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }

    .timestamp-cell { display: flex; flex-direction: column; }
    .timestamp-cell small { color: var(--text-color-secondary); font-size: 0.75rem; }
    .entity-cell, .user-cell { display: flex; flex-direction: column; }
    .entity-cell small, .user-cell small { color: var(--text-color-secondary); font-size: 0.75rem; }
    .description-cell { max-width: 300px; }
    .description-cell small { display: block; color: var(--text-color-secondary); font-size: 0.75rem; margin-top: 0.25rem; }
    code { background: var(--surface-ground); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.75rem; }
    .text-center { text-align: center; }

    .detail-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item .label, .detail-section .label, .changes-section .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .detail-section { padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .description-text { margin: 0.5rem 0 0; }
    .changes-section .label { display: block; margin-bottom: 0.75rem; }
    .changes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .change-column { background: var(--surface-ground); padding: 1rem; border-radius: 8px; }
    .change-column.old { border-left: 3px solid #f59e0b; }
    .change-column.new { border-left: 3px solid #10b981; }
    .change-column h5 { margin: 0 0 0.5rem; font-size: 0.875rem; }
    .change-column pre { margin: 0; font-size: 0.75rem; overflow-x: auto; white-space: pre-wrap; }
  `]
})
export class AuditLogViewerComponent implements OnInit {
  dateRange: Date[] | null = null;
  selectedActionType = '';
  selectedEntityType = '';
  selectedUser = '';
  searchQuery = '';
  showDetailsDialog = false;
  selectedLog: AuditLog | null = null;

  actionTypeOptions = [
    { label: 'Create', value: 'CREATE' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Delete', value: 'DELETE' },
    { label: 'Payment', value: 'PAYMENT' },
    { label: 'Adjustment', value: 'ADJUSTMENT' },
    { label: 'Approval', value: 'APPROVAL' },
    { label: 'Export', value: 'EXPORT' }
  ];

  entityTypeOptions = [
    { label: 'Payment', value: 'Payment' },
    { label: 'Receipt', value: 'Receipt' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Adjustment', value: 'Adjustment' },
    { label: 'Fee Structure', value: 'FeeStructure' },
    { label: 'Student Ledger', value: 'Ledger' }
  ];

  userOptions = [
    { label: 'Admin User', value: 'Admin User' },
    { label: 'Ramesh Kumar', value: 'Ramesh Kumar' },
    { label: 'Sunita Sharma', value: 'Sunita Sharma' },
    { label: 'Principal', value: 'Principal' }
  ];

  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.auditLogs = [
      { id: 'LOG-001', timestamp: new Date('2026-01-15T10:30:00'), action: 'PAYMENT', actionType: 'PAYMENT', entityType: 'Payment', entityId: 'PAY-2026-0154', entityName: 'Rahul Sharma', performedBy: 'Ramesh Kumar', performedByRole: 'Accountant', ipAddress: '192.168.1.45', oldValue: null, newValue: { amount: 12000, mode: 'Online' }, description: 'Payment of ₹12,000 received for Tuition Fee' },
      { id: 'LOG-002', timestamp: new Date('2026-01-15T10:15:00'), action: 'ADJUSTMENT', actionType: 'ADJUSTMENT', entityType: 'Adjustment', entityId: 'ADJ-2026-0089', entityName: 'Amit Kumar', performedBy: 'Admin User', performedByRole: 'Admin', ipAddress: '192.168.1.10', oldValue: null, newValue: { type: 'Discount', amount: 5000 }, description: 'Sibling discount of ₹5,000 applied' },
      { id: 'LOG-003', timestamp: new Date('2026-01-15T09:45:00'), action: 'APPROVAL', actionType: 'APPROVAL', entityType: 'Adjustment', entityId: 'ADJ-2026-0088', entityName: 'Neha Gupta', performedBy: 'Principal', performedByRole: 'Principal', ipAddress: '192.168.1.20', oldValue: { status: 'PENDING' }, newValue: { status: 'APPROVED' }, description: 'Staff ward concession approved for Neha Gupta' },
      { id: 'LOG-004', timestamp: new Date('2026-01-15T09:30:00'), action: 'CREATE', actionType: 'CREATE', entityType: 'Contract', entityId: 'CNT-2026-0567', entityName: 'New Admission - Class 5', performedBy: 'Admin User', performedByRole: 'Admin', ipAddress: '192.168.1.10', oldValue: null, newValue: { students: 5, structure: 'Annual 2025-26' }, description: 'Fee contracts generated for 5 new admissions' },
      { id: 'LOG-005', timestamp: new Date('2026-01-14T16:20:00'), action: 'UPDATE', actionType: 'UPDATE', entityType: 'FeeStructure', entityId: 'FS-2025-001', entityName: 'Annual Fee 2025-26', performedBy: 'Admin User', performedByRole: 'Admin', ipAddress: '192.168.1.10', oldValue: { labFee: 5000 }, newValue: { labFee: 5500 }, description: 'Lab fee updated from ₹5,000 to ₹5,500' },
      { id: 'LOG-006', timestamp: new Date('2026-01-14T15:00:00'), action: 'PAYMENT', actionType: 'PAYMENT', entityType: 'Payment', entityId: 'PAY-2026-0153', entityName: 'Priya Singh', performedBy: 'Sunita Sharma', performedByRole: 'Accountant', ipAddress: '192.168.1.46', oldValue: null, newValue: { amount: 8500, mode: 'Cash' }, description: 'Payment of ₹8,500 received in cash' },
      { id: 'LOG-007', timestamp: new Date('2026-01-14T14:30:00'), action: 'EXPORT', actionType: 'EXPORT', entityType: 'Receipt', entityId: 'BATCH-0045', entityName: 'Daily Collection Report', performedBy: 'Ramesh Kumar', performedByRole: 'Accountant', ipAddress: '192.168.1.45', oldValue: null, newValue: { format: 'PDF', records: 45 }, description: 'Exported daily collection report for 14-Jan-2026' },
      { id: 'LOG-008', timestamp: new Date('2026-01-14T11:00:00'), action: 'DELETE', actionType: 'DELETE', entityType: 'Adjustment', entityId: 'ADJ-2026-0085', entityName: 'Cancelled Adjustment', performedBy: 'Admin User', performedByRole: 'Admin', ipAddress: '192.168.1.10', oldValue: { type: 'Waiver', amount: 3000 }, newValue: null, description: 'Pending adjustment cancelled - duplicate entry' }
    ];
    this.filteredLogs = [...this.auditLogs];
  }

  filterLogs(): void {
    this.filteredLogs = this.auditLogs.filter(log => {
      const matchSearch = !this.searchQuery || log.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchAction = !this.selectedActionType || log.actionType === this.selectedActionType;
      const matchEntity = !this.selectedEntityType || log.entityType === this.selectedEntityType;
      const matchUser = !this.selectedUser || log.performedBy === this.selectedUser;
      return matchSearch && matchAction && matchEntity && matchUser;
    });
  }

  clearFilters(): void {
    this.dateRange = null;
    this.selectedActionType = '';
    this.selectedEntityType = '';
    this.selectedUser = '';
    this.searchQuery = '';
    this.filteredLogs = [...this.auditLogs];
  }

  getActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'CREATE': 'success',
      'UPDATE': 'info',
      'DELETE': 'danger',
      'PAYMENT': 'success',
      'ADJUSTMENT': 'warn',
      'APPROVAL': 'info',
      'EXPORT': 'info'
    };
    return map[action] || 'info';
  }

  viewLogDetails(log: AuditLog): void {
    this.selectedLog = log;
    this.showDetailsDialog = true;
  }

  exportLogs(): void {
    // Export logic
  }
}
