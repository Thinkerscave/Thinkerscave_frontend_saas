import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService, ConfirmationService } from 'primeng/api';

interface ConcessionType {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  applicableTo: string[];
  requiresApproval: boolean;
  maxLimit?: number;
  isActive: boolean;
  usageCount: number;
}

@Component({
  selector: 'app-concession-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, InputNumberModule, InputTextarea, DropdownModule, DialogModule, TooltipModule, ToastModule, ConfirmDialogModule, InputSwitchModule, MultiSelectModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="concession-list">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <div class="page-header">
        <div>
          <h2><i class="pi pi-star"></i> Concession Master</h2>
          <p>Manage predefined concession types and scholarships</p>
        </div>
        <button pButton label="Add Concession Type" icon="pi pi-plus" (click)="openForm()"></button>
      </div>

      <!-- Quick Stats -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ concessionTypes.length }}</span>
          <span class="stat-label">Total Types</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ getActiveCount() }}</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ getTotalUsage() }}</span>
          <span class="stat-label">Total Applied</span>
        </div>
      </div>

      <div class="content-card">
        <div class="filters-row">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="searchQuery" placeholder="Search concession types..." (input)="filterConcessions()" />
          </span>
          <p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="All Status" optionLabel="label" optionValue="value" [showClear]="true" (onChange)="filterConcessions()"></p-dropdown>
        </div>

        <p-table [value]="filteredConcessions" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Code</th>
              <th>Concession Type</th>
              <th>Discount</th>
              <th>Applicable To</th>
              <th>Approval</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-con>
            <tr>
              <td><code>{{ con.code }}</code></td>
              <td>
                <div class="type-info">
                  <strong>{{ con.name }}</strong>
                  <small>{{ con.description }}</small>
                </div>
              </td>
              <td>
                <span class="discount-value">
                  {{ con.discountType === 'PERCENTAGE' ? con.value + '%' : '₹' + (con.value | number) }}
                </span>
                <small *ngIf="con.maxLimit" class="max-limit">Max: ₹{{ con.maxLimit | number }}</small>
              </td>
              <td>
                <div class="applicable-tags">
                  <p-tag *ngFor="let item of con.applicableTo.slice(0, 2)" [value]="item" severity="info" [style]="{'font-size':'0.7rem'}"></p-tag>
                  <span *ngIf="con.applicableTo.length > 2" class="more-badge">+{{ con.applicableTo.length - 2 }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="con.requiresApproval ? 'Required' : 'Auto'" [severity]="con.requiresApproval ? 'warn' : 'success'"></p-tag>
              </td>
              <td>
                <span class="usage-count">{{ con.usageCount }}</span>
              </td>
              <td>
                <p-inputSwitch [(ngModel)]="con.isActive" (onChange)="toggleStatus(con)"></p-inputSwitch>
              </td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="Edit" (click)="editConcession(con)"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" pTooltip="Delete" (click)="deleteConcession(con)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8" class="text-center p-4">No concession types found</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Add/Edit Dialog -->
      <p-dialog [(visible)]="showFormDialog" [header]="isEditing ? 'Edit Concession Type' : 'Add Concession Type'" [modal]="true" [style]="{width:'600px'}">
        <div class="form-content">
          <div class="form-grid">
            <div class="form-field">
              <label>Code *</label>
              <input pInputText [(ngModel)]="formData.code" placeholder="e.g., STAFF_WARD" [disabled]="isEditing" />
            </div>
            <div class="form-field">
              <label>Name *</label>
              <input pInputText [(ngModel)]="formData.name" placeholder="e.g., Staff Ward Concession" />
            </div>
          </div>
          <div class="form-field full-width">
            <label>Description</label>
            <textarea pInputTextarea [(ngModel)]="formData.description" [rows]="2" placeholder="Brief description..."></textarea>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label>Discount Type *</label>
              <p-dropdown [options]="discountTypeOptions" [(ngModel)]="formData.discountType" placeholder="Select" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ formData.discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount' }} *</label>
              <p-inputNumber [(ngModel)]="formData.value" [min]="0" [max]="formData.discountType === 'PERCENTAGE' ? 100 : 9999999"
                             [prefix]="formData.discountType === 'FIXED' ? '₹' : ''" [suffix]="formData.discountType === 'PERCENTAGE' ? '%' : ''"></p-inputNumber>
            </div>
          </div>
          <div class="form-field full-width" *ngIf="formData.discountType === 'PERCENTAGE'">
            <label>Maximum Limit (Optional)</label>
            <p-inputNumber [(ngModel)]="formData.maxLimit" [min]="0" prefix="₹" placeholder="Leave empty for no limit"></p-inputNumber>
          </div>
          <div class="form-field full-width">
            <label>Applicable To *</label>
            <p-multiSelect [options]="feeHeadOptions" [(ngModel)]="formData.applicableTo" placeholder="Select fee heads" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-multiSelect>
          </div>
          <div class="form-row">
            <div class="form-field switch-field">
              <label>Requires Approval</label>
              <p-inputSwitch [(ngModel)]="formData.requiresApproval"></p-inputSwitch>
            </div>
            <div class="form-field switch-field">
              <label>Active</label>
              <p-inputSwitch [(ngModel)]="formData.isActive"></p-inputSwitch>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showFormDialog = false"></button>
          <button pButton [label]="isEditing ? 'Update' : 'Create'" icon="pi pi-check" (click)="saveConcession()" [disabled]="!isFormValid()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .concession-list { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }

    .stats-row { display: flex; gap: 2rem; padding: 1.25rem 1.5rem; background: var(--surface-card); border-radius: 12px; margin-bottom: 1.5rem; }
    .stat-item { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--primary-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }

    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; }
    .type-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .type-info small { color: var(--text-color-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .discount-value { font-weight: 600; font-size: 1.1rem; color: #10b981; display: block; }
    .max-limit { color: var(--text-color-secondary); display: block; }
    .applicable-tags { display: flex; gap: 0.25rem; align-items: center; flex-wrap: wrap; }
    .more-badge { font-size: 0.75rem; background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; }
    .usage-count { font-weight: 600; font-size: 1.1rem; }
    .text-center { text-align: center; }

    .form-content { display: flex; flex-direction: column; gap: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field.full-width { grid-column: span 2; }
    .form-field label { font-weight: 500; font-size: 0.875rem; color: var(--text-color-secondary); }
    .form-field input, .form-field textarea { width: 100%; }
    .form-row { display: flex; gap: 2rem; }
    .switch-field { flex-direction: row; align-items: center; gap: 1rem; }
  `]
})
export class ConcessionListComponent implements OnInit {
  searchQuery = '';
  selectedStatus = '';
  showFormDialog = false;
  isEditing = false;

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  discountTypeOptions = [
    { label: 'Percentage', value: 'PERCENTAGE' },
    { label: 'Fixed Amount', value: 'FIXED' }
  ];

  feeHeadOptions = [
    { label: 'Tuition Fee', value: 'Tuition' },
    { label: 'Transport Fee', value: 'Transport' },
    { label: 'Lab Fee', value: 'Lab' },
    { label: 'Library Fee', value: 'Library' },
    { label: 'Sports Fee', value: 'Sports' },
    { label: 'All Fees', value: 'All' }
  ];

  formData: Partial<ConcessionType> = {};
  concessionTypes: ConcessionType[] = [];
  filteredConcessions: ConcessionType[] = [];

  constructor(private messageService: MessageService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loadConcessionTypes();
  }

  loadConcessionTypes(): void {
    this.concessionTypes = [
      { id: '1', code: 'STAFF_WARD', name: 'Staff Ward Concession', description: 'Discount for children of school staff members', discountType: 'PERCENTAGE', value: 25, applicableTo: ['Tuition'], requiresApproval: true, isActive: true, usageCount: 12 },
      { id: '2', code: 'SIBLING', name: 'Sibling Discount', description: 'Discount for second and subsequent siblings', discountType: 'PERCENTAGE', value: 10, applicableTo: ['Tuition'], requiresApproval: false, isActive: true, usageCount: 45 },
      { id: '3', code: 'MERIT_SCHOLAR', name: 'Merit Scholarship', description: 'For students with outstanding academic performance', discountType: 'PERCENTAGE', value: 50, maxLimit: 50000, applicableTo: ['Tuition', 'Lab'], requiresApproval: true, isActive: true, usageCount: 8 },
      { id: '4', code: 'SPORTS_EXCEL', name: 'Sports Excellence', description: 'For state/national level sports achievers', discountType: 'PERCENTAGE', value: 30, applicableTo: ['Tuition', 'Sports'], requiresApproval: true, isActive: true, usageCount: 5 },
      { id: '5', code: 'EARLY_BIRD', name: 'Early Payment Discount', description: 'Discount for paying full year fees in advance', discountType: 'PERCENTAGE', value: 5, applicableTo: ['All'], requiresApproval: false, isActive: true, usageCount: 156 },
      { id: '6', code: 'FINANCIAL_AID', name: 'Financial Aid', description: 'For economically weaker section students', discountType: 'FIXED', value: 20000, applicableTo: ['Tuition'], requiresApproval: true, isActive: true, usageCount: 23 },
      { id: '7', code: 'RTE_QUOTA', name: 'RTE Quota', description: 'Right to Education Act quota students', discountType: 'PERCENTAGE', value: 100, applicableTo: ['All'], requiresApproval: true, isActive: false, usageCount: 0 }
    ];
    this.filteredConcessions = [...this.concessionTypes];
  }

  filterConcessions(): void {
    this.filteredConcessions = this.concessionTypes.filter(con => {
      const matchSearch = !this.searchQuery || con.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || con.code.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = !this.selectedStatus || (this.selectedStatus === 'active' ? con.isActive : !con.isActive);
      return matchSearch && matchStatus;
    });
  }

  getActiveCount(): number { return this.concessionTypes.filter(c => c.isActive).length; }
  getTotalUsage(): number { return this.concessionTypes.reduce((sum, c) => sum + c.usageCount, 0); }

  openForm(): void {
    this.isEditing = false;
    this.formData = {
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      value: 0,
      applicableTo: [],
      requiresApproval: true,
      isActive: true
    };
    this.showFormDialog = true;
  }

  editConcession(con: ConcessionType): void {
    this.isEditing = true;
    this.formData = { ...con };
    this.showFormDialog = true;
  }

  isFormValid(): boolean {
    return !!(this.formData.code?.trim() && this.formData.name?.trim() && this.formData.value && this.formData.applicableTo?.length);
  }

  saveConcession(): void {
    if (this.isEditing) {
      const index = this.concessionTypes.findIndex(c => c.id === this.formData.id);
      if (index !== -1) {
        this.concessionTypes[index] = { ...this.concessionTypes[index], ...this.formData } as ConcessionType;
      }
      this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Concession type updated successfully', life: 3000 });
    } else {
      const newConcession: ConcessionType = {
        ...this.formData as ConcessionType,
        id: Date.now().toString(),
        usageCount: 0
      };
      this.concessionTypes.push(newConcession);
      this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Concession type created successfully', life: 3000 });
    }
    this.filterConcessions();
    this.showFormDialog = false;
  }

  deleteConcession(con: ConcessionType): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${con.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.concessionTypes = this.concessionTypes.filter(c => c.id !== con.id);
        this.filterConcessions();
        this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: 'Concession type deleted', life: 3000 });
      }
    });
  }

  toggleStatus(con: ConcessionType): void {
    this.messageService.add({
      severity: con.isActive ? 'success' : 'info',
      summary: con.isActive ? 'Activated' : 'Deactivated',
      detail: `${con.name} is now ${con.isActive ? 'active' : 'inactive'}`,
      life: 3000
    });
  }
}
