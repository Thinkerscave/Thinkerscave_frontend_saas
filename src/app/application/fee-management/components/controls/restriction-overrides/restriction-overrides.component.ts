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
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService, ConfirmationService } from 'primeng/api';

interface Override {
  id: string;
  studentName: string;
  admissionNo: string;
  className: string;
  restrictionType: string;
  reason: string;
  grantedBy: string;
  grantedDate: Date;
  expiryDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

@Component({
  selector: 'app-restriction-overrides',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, InputTextarea, DropdownModule, CalendarModule, DialogModule, TooltipModule, ToastModule, ConfirmDialogModule, AutoCompleteModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="restriction-overrides">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <div class="page-header">
        <div>
          <h2><i class="pi pi-key"></i> Restriction Overrides</h2>
          <p>Grant and manage temporary restriction overrides</p>
        </div>
        <div class="header-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
          <button pButton label="Grant Override" icon="pi pi-plus" (click)="openForm()"></button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card active">
          <span class="stat-value">{{ getActiveCount() }}</span>
          <span class="stat-label">Active Overrides</span>
        </div>
        <div class="stat-card expiring">
          <span class="stat-value">{{ getExpiringCount() }}</span>
          <span class="stat-label">Expiring Soon</span>
        </div>
        <div class="stat-card expired">
          <span class="stat-value">{{ getExpiredCount() }}</span>
          <span class="stat-label">Expired This Month</span>
        </div>
      </div>

      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search student..." (input)="filterOverrides()" />
          </span>
          <p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="All Status" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterOverrides()"></p-dropdown>
          <p-dropdown [options]="restrictionTypes" [(ngModel)]="selectedType" placeholder="All Types" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterOverrides()"></p-dropdown>
        </div>

        <p-table [value]="filteredOverrides" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Student</th>
              <th>Restriction</th>
              <th>Reason</th>
              <th>Granted By</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-o>
            <tr [class.expiring-soon]="isExpiringSoon(o)">
              <td>
                <div class="student-cell">
                  <strong>{{ o.studentName }}</strong>
                  <small>{{ o.admissionNo }} | {{ o.className }}</small>
                </div>
              </td>
              <td><p-tag [value]="o.restrictionType" severity="danger"></p-tag></td>
              <td class="reason-cell">{{ o.reason }}</td>
              <td>
                <div class="granted-cell">
                  <span>{{ o.grantedBy }}</span>
                  <small>{{ o.grantedDate | date:'dd MMM yyyy' }}</small>
                </div>
              </td>
              <td>
                <div class="expiry-cell" [class.expiring]="isExpiringSoon(o)">
                  <span>{{ o.expiryDate | date:'dd MMM yyyy' }}</span>
                  <small *ngIf="isExpiringSoon(o)" class="warning"><i class="pi pi-exclamation-triangle"></i> Expires soon</small>
                </div>
              </td>
              <td><p-tag [value]="o.status" [severity]="getStatusSeverity(o.status)"></p-tag></td>
              <td>
                <button *ngIf="o.status === 'ACTIVE'" pButton icon="pi pi-calendar-plus" class="p-button-text p-button-sm" pTooltip="Extend" (click)="extendOverride(o)"></button>
                <button *ngIf="o.status === 'ACTIVE'" pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" pTooltip="Revoke" (click)="revokeOverride(o)"></button>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" (click)="viewOverride(o)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7" class="text-center p-4">No overrides found</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Grant Override Dialog -->
      <p-dialog [(visible)]="showFormDialog" [header]="'Grant Override'" [modal]="true" [style]="{width:'550px'}">
        <div class="form-content">
          <div class="form-field">
            <label>Select Student *</label>
            <p-autoComplete [(ngModel)]="selectedStudent" [suggestions]="filteredStudents" (completeMethod)="searchStudents($event)"
                            field="name" [dropdown]="true" placeholder="Search student..."
                            [style]="{'width':'100%'}" [inputStyle]="{'width':'100%'}">
              <ng-template let-s pTemplate="item">
                <div class="student-option">
                  <strong>{{ s.name }}</strong>
                  <span class="meta">{{ s.admissionNo }} | {{ s.className }}</span>
                </div>
              </ng-template>
            </p-autoComplete>
          </div>

          <div class="form-field">
            <label>Restriction to Override *</label>
            <p-dropdown [options]="restrictionTypes" [(ngModel)]="formData.restrictionType" placeholder="Select" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-dropdown>
          </div>

          <div class="form-field">
            <label>Valid Until *</label>
            <p-calendar [(ngModel)]="formData.expiryDate" [showIcon]="true" dateFormat="dd/mm/yy" [minDate]="minDate" [style]="{'width':'100%'}"></p-calendar>
          </div>

          <div class="form-field">
            <label>Reason for Override *</label>
            <textarea pInputTextarea [(ngModel)]="formData.reason" [rows]="3" placeholder="Enter justification..." [style]="{'width':'100%'}"></textarea>
          </div>

          <div class="warning-box">
            <i class="pi pi-exclamation-triangle"></i>
            <p>This override will temporarily allow the student to access services despite having outstanding fee restrictions. The override will automatically expire on the specified date.</p>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showFormDialog = false"></button>
          <button pButton label="Grant Override" icon="pi pi-check" (click)="grantOverride()" [disabled]="!isFormValid()"></button>
        </ng-template>
      </p-dialog>

      <!-- View Details Dialog -->
      <p-dialog [(visible)]="showViewDialog" [header]="'Override Details'" [modal]="true" [style]="{width:'500px'}">
        <div class="detail-content" *ngIf="selectedOverride">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Student</span>
              <span class="value">{{ selectedOverride.studentName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Admission No</span>
              <span class="value">{{ selectedOverride.admissionNo }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Restriction</span>
              <span class="value"><p-tag [value]="selectedOverride.restrictionType" severity="danger"></p-tag></span>
            </div>
            <div class="detail-item">
              <span class="label">Status</span>
              <span class="value"><p-tag [value]="selectedOverride.status" [severity]="getStatusSeverity(selectedOverride.status)"></p-tag></span>
            </div>
            <div class="detail-item">
              <span class="label">Granted By</span>
              <span class="value">{{ selectedOverride.grantedBy }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Granted On</span>
              <span class="value">{{ selectedOverride.grantedDate | date:'dd MMM yyyy' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Expires On</span>
              <span class="value">{{ selectedOverride.expiryDate | date:'dd MMM yyyy' }}</span>
            </div>
          </div>
          <div class="reason-box">
            <span class="label">Reason</span>
            <p>{{ selectedOverride.reason }}</p>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .restriction-overrides { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { flex: 1; background: var(--surface-card); border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .stat-card.active .stat-value { color: #10b981; }
    .stat-card.expiring .stat-value { color: #f59e0b; }
    .stat-card.expired .stat-value { color: #ef4444; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

    .student-cell, .granted-cell { display: flex; flex-direction: column; }
    .student-cell small, .granted-cell small { color: var(--text-color-secondary); }
    .reason-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .expiry-cell.expiring { color: #f59e0b; }
    .expiry-cell .warning { display: flex; align-items: center; gap: 0.25rem; color: #f59e0b; }
    .expiring-soon { background: rgba(245, 158, 11, 0.05); }
    .text-center { text-align: center; }

    .form-content { display: flex; flex-direction: column; gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field label { font-weight: 500; font-size: 0.875rem; }
    .student-option { display: flex; flex-direction: column; }
    .student-option .meta { font-size: 0.75rem; color: var(--text-color-secondary); }

    .warning-box { display: flex; gap: 1rem; padding: 1rem; background: #fef3c7; border-radius: 8px; color: #92400e; }
    .warning-box i { font-size: 1.25rem; }
    .warning-box p { margin: 0; font-size: 0.875rem; }

    .detail-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .detail-item .value { font-weight: 500; }
    .reason-box { background: var(--surface-ground); padding: 1rem; border-radius: 8px; }
    .reason-box .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
    .reason-box p { margin: 0; }
  `]
})
export class RestrictionOverridesComponent implements OnInit {
  searchQuery = '';
  selectedStatus = '';
  selectedType = '';
  showFormDialog = false;
  showViewDialog = false;
  selectedStudent: any = null;
  filteredStudents: any[] = [];
  selectedOverride: Override | null = null;
  minDate = new Date();

  formData: Partial<Override> = {};

  statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Revoked', value: 'REVOKED' }
  ];

  restrictionTypes = [
    { label: 'Exam Hold', value: 'Exam Hold' },
    { label: 'Report Card Hold', value: 'Report Card Hold' },
    { label: 'Transfer Block', value: 'Transfer Block' }
  ];

  students = [
    { id: '1', name: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10-A' },
    { id: '2', name: 'Amit Kumar', admissionNo: 'ADM2024003', className: 'Class 12-A' },
    { id: '3', name: 'Rohan Mehta', admissionNo: 'ADM2024007', className: 'Class 8-B' }
  ];

  overrides: Override[] = [];
  filteredOverrides: Override[] = [];

  constructor(private messageService: MessageService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loadOverrides();
  }

  loadOverrides(): void {
    this.overrides = [
      { id: '1', studentName: 'Amit Kumar', admissionNo: 'ADM2024003', className: 'Class 12-A', restrictionType: 'Exam Hold', reason: 'Board exam - Parent committed to pay post exams', grantedBy: 'Principal', grantedDate: new Date('2026-01-10'), expiryDate: new Date('2026-01-20'), status: 'ACTIVE' },
      { id: '2', studentName: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10-A', restrictionType: 'Report Card Hold', reason: 'Medical emergency in family - temporary waiver', grantedBy: 'Admin', grantedDate: new Date('2025-12-15'), expiryDate: new Date('2026-01-05'), status: 'EXPIRED' },
      { id: '3', studentName: 'Kavita Singh', admissionNo: 'ADM2024010', className: 'Class 10-B', restrictionType: 'Exam Hold', reason: 'Payment plan agreed - installments starting next month', grantedBy: 'Accountant', grantedDate: new Date('2026-01-05'), expiryDate: new Date('2026-02-15'), status: 'ACTIVE' }
    ];
    this.filteredOverrides = [...this.overrides];
  }

  filterOverrides(): void {
    this.filteredOverrides = this.overrides.filter(o => {
      const matchSearch = !this.searchQuery || o.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) || o.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = !this.selectedStatus || o.status === this.selectedStatus;
      const matchType = !this.selectedType || o.restrictionType === this.selectedType;
      return matchSearch && matchStatus && matchType;
    });
  }

  getActiveCount(): number { return this.overrides.filter(o => o.status === 'ACTIVE').length; }
  getExpiringCount(): number { return this.overrides.filter(o => o.status === 'ACTIVE' && this.isExpiringSoon(o)).length; }
  getExpiredCount(): number { return this.overrides.filter(o => o.status === 'EXPIRED').length; }

  isExpiringSoon(o: Override): boolean {
    if (o.status !== 'ACTIVE') return false;
    const daysUntilExpiry = Math.ceil((o.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'warn' | 'danger'> = { 'ACTIVE': 'success', 'EXPIRED': 'warn', 'REVOKED': 'danger' };
    return map[status] || 'info';
  }

  searchStudents(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredStudents = this.students.filter(s => s.name.toLowerCase().includes(query) || s.admissionNo.toLowerCase().includes(query));
  }

  openForm(): void {
    this.selectedStudent = null;
    this.formData = { restrictionType: '', expiryDate: undefined, reason: '' };
    this.showFormDialog = true;
  }

  isFormValid(): boolean {
    return !!(this.selectedStudent?.id && this.formData.restrictionType && this.formData.expiryDate && this.formData.reason?.trim());
  }

  grantOverride(): void {
    const newOverride: Override = {
      id: Date.now().toString(),
      studentName: this.selectedStudent.name,
      admissionNo: this.selectedStudent.admissionNo,
      className: this.selectedStudent.className,
      restrictionType: this.formData.restrictionType!,
      reason: this.formData.reason!,
      grantedBy: 'Current User',
      grantedDate: new Date(),
      expiryDate: this.formData.expiryDate!,
      status: 'ACTIVE'
    };
    this.overrides.unshift(newOverride);
    this.filterOverrides();
    this.showFormDialog = false;
    this.messageService.add({ severity: 'success', summary: 'Override Granted', detail: `Override granted for ${newOverride.studentName}`, life: 3000 });
  }

  extendOverride(o: Override): void {
    this.messageService.add({ severity: 'info', summary: 'Extension', detail: 'Override extended by 7 days', life: 3000 });
  }

  revokeOverride(o: Override): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke the override for ${o.studentName}?`,
      header: 'Confirm Revocation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        o.status = 'REVOKED';
        this.filterOverrides();
        this.messageService.add({ severity: 'warn', summary: 'Revoked', detail: `Override revoked for ${o.studentName}`, life: 3000 });
      }
    });
  }

  viewOverride(o: Override): void {
    this.selectedOverride = o;
    this.showViewDialog = true;
  }
}
