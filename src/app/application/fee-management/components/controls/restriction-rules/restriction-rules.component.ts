import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

interface RestrictionRule {
  id: string;
  name: string;
  restrictionType: string;
  triggerCondition: string;
  daysOverdue: number;
  minAmount: number;
  applyTo: string[];
  isActive: boolean;
  autoApply: boolean;
  notifyParent: boolean;
  notifyStudent: boolean;
}

@Component({
  selector: 'app-restriction-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TableModule, TagModule, InputTextModule, InputNumberModule, DropdownModule, MultiSelectModule, InputSwitchModule, DialogModule, TooltipModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="restriction-rules">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <div class="page-header">
        <div>
          <h2><i class="pi pi-cog"></i> Restriction Rules</h2>
          <p>Configure automatic academic restriction rules</p>
        </div>
        <div class="header-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
          <button pButton label="Add Rule" icon="pi pi-plus" (click)="openForm()"></button>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>How Restriction Rules Work</strong>
          <p>Rules are evaluated daily. When a student meets the trigger conditions, the specified restrictions are automatically applied. Parents and students can be notified based on your configuration.</p>
        </div>
      </div>

      <div class="content-card">
        <p-table [value]="rules" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Rule Name</th>
              <th>Restriction Type</th>
              <th>Trigger Condition</th>
              <th>Apply To</th>
              <th>Notifications</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-rule>
            <tr>
              <td>
                <div class="rule-name">
                  <strong>{{ rule.name }}</strong>
                  <small *ngIf="rule.autoApply"><i class="pi pi-bolt"></i> Auto-apply</small>
                </div>
              </td>
              <td><p-tag [value]="rule.restrictionType" severity="danger"></p-tag></td>
              <td>
                <div class="condition-cell">
                  <span>{{ rule.triggerCondition }}</span>
                  <small>After {{ rule.daysOverdue }} days | Min ₹{{ rule.minAmount | number }}</small>
                </div>
              </td>
              <td>
                <div class="apply-to-tags">
                  <p-tag *ngFor="let cls of rule.applyTo.slice(0, 2)" [value]="cls" severity="info" [style]="{'font-size':'0.7rem'}"></p-tag>
                  <span *ngIf="rule.applyTo.length > 2" class="more-badge">+{{ rule.applyTo.length - 2 }}</span>
                </div>
              </td>
              <td>
                <div class="notification-icons">
                  <i class="pi pi-user" [class.active]="rule.notifyParent" pTooltip="Parent"></i>
                  <i class="pi pi-users" [class.active]="rule.notifyStudent" pTooltip="Student"></i>
                </div>
              </td>
              <td>
                <p-inputSwitch [(ngModel)]="rule.isActive" (onChange)="toggleRule(rule)"></p-inputSwitch>
              </td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="Edit" (click)="editRule(rule)"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" pTooltip="Delete" (click)="deleteRule(rule)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Add/Edit Dialog -->
      <p-dialog [(visible)]="showFormDialog" [header]="isEditing ? 'Edit Rule' : 'Add Rule'" [modal]="true" [style]="{width:'650px'}">
        <div class="form-content">
          <div class="form-field">
            <label>Rule Name *</label>
            <input pInputText [(ngModel)]="formData.name" placeholder="e.g., Exam Hold for Overdue Fees" />
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Restriction Type *</label>
              <p-dropdown [options]="restrictionTypes" [(ngModel)]="formData.restrictionType" placeholder="Select" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-dropdown>
            </div>
            <div class="form-field">
              <label>Trigger Condition *</label>
              <p-dropdown [options]="triggerConditions" [(ngModel)]="formData.triggerCondition" placeholder="Select" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-dropdown>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Days Overdue *</label>
              <p-inputNumber [(ngModel)]="formData.daysOverdue" [min]="1" [max]="365" suffix=" days"></p-inputNumber>
            </div>
            <div class="form-field">
              <label>Minimum Amount</label>
              <p-inputNumber [(ngModel)]="formData.minAmount" [min]="0" prefix="₹"></p-inputNumber>
            </div>
          </div>

          <div class="form-field">
            <label>Apply To Classes *</label>
            <p-multiSelect [options]="classOptions" [(ngModel)]="formData.applyTo" placeholder="Select classes" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-multiSelect>
          </div>

          <div class="form-row">
            <div class="form-field switch-field">
              <p-inputSwitch [(ngModel)]="formData.autoApply"></p-inputSwitch>
              <label>Auto-apply restriction</label>
            </div>
            <div class="form-field switch-field">
              <p-inputSwitch [(ngModel)]="formData.notifyParent"></p-inputSwitch>
              <label>Notify Parent</label>
            </div>
            <div class="form-field switch-field">
              <p-inputSwitch [(ngModel)]="formData.notifyStudent"></p-inputSwitch>
              <label>Notify Student</label>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showFormDialog = false"></button>
          <button pButton [label]="isEditing ? 'Update' : 'Create'" icon="pi pi-check" (click)="saveRule()" [disabled]="!isFormValid()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .restriction-rules { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }

    .info-banner { display: flex; gap: 1rem; padding: 1rem 1.5rem; background: #dbeafe; border-radius: 12px; margin-bottom: 1.5rem; color: #1e40af; }
    .info-banner i { font-size: 1.5rem; margin-top: 0.25rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; font-size: 0.875rem; opacity: 0.9; }

    .content-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }

    .rule-name { display: flex; flex-direction: column; }
    .rule-name small { display: flex; align-items: center; gap: 0.25rem; color: #f59e0b; font-size: 0.75rem; margin-top: 0.25rem; }
    .condition-cell { display: flex; flex-direction: column; }
    .condition-cell small { color: var(--text-color-secondary); }
    .apply-to-tags { display: flex; gap: 0.25rem; align-items: center; flex-wrap: wrap; }
    .more-badge { font-size: 0.75rem; background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; }
    .notification-icons { display: flex; gap: 0.75rem; }
    .notification-icons i { color: var(--surface-border); font-size: 1.1rem; }
    .notification-icons i.active { color: #10b981; }

    .form-content { display: flex; flex-direction: column; gap: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field label { font-weight: 500; font-size: 0.875rem; color: var(--text-color-secondary); }
    .form-field input { width: 100%; }
    .form-row { display: flex; gap: 2rem; flex-wrap: wrap; }
    .switch-field { flex-direction: row; align-items: center; gap: 0.75rem; }
  `]
})
export class RestrictionRulesComponent implements OnInit {
  showFormDialog = false;
  isEditing = false;
  formData: Partial<RestrictionRule> = {};

  restrictionTypes = [
    { label: 'Exam Hold', value: 'Exam Hold' },
    { label: 'Report Card Hold', value: 'Report Card Hold' },
    { label: 'Transfer Block', value: 'Transfer Block' },
    { label: 'Library Block', value: 'Library Block' }
  ];

  triggerConditions = [
    { label: 'Fee Overdue', value: 'Fee Overdue' },
    { label: 'Installment Missed', value: 'Installment Missed' },
    { label: 'Outstanding > Threshold', value: 'Outstanding Threshold' }
  ];

  classOptions = [
    { label: 'All Classes', value: 'All' },
    { label: 'Class 5', value: 'Class 5' },
    { label: 'Class 8', value: 'Class 8' },
    { label: 'Class 10', value: 'Class 10' },
    { label: 'Class 12', value: 'Class 12' }
  ];

  rules: RestrictionRule[] = [];

  constructor(private messageService: MessageService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.rules = [
      { id: '1', name: 'Exam Hold for Overdue Fees', restrictionType: 'Exam Hold', triggerCondition: 'Fee Overdue', daysOverdue: 30, minAmount: 5000, applyTo: ['All'], isActive: true, autoApply: true, notifyParent: true, notifyStudent: true },
      { id: '2', name: 'Report Card Hold - 45 Days', restrictionType: 'Report Card Hold', triggerCondition: 'Fee Overdue', daysOverdue: 45, minAmount: 10000, applyTo: ['Class 10', 'Class 12'], isActive: true, autoApply: true, notifyParent: true, notifyStudent: false },
      { id: '3', name: 'Transfer Block - Critical', restrictionType: 'Transfer Block', triggerCondition: 'Outstanding Threshold', daysOverdue: 60, minAmount: 25000, applyTo: ['All'], isActive: true, autoApply: false, notifyParent: true, notifyStudent: false },
      { id: '4', name: 'Library Access Hold', restrictionType: 'Library Block', triggerCondition: 'Installment Missed', daysOverdue: 15, minAmount: 0, applyTo: ['Class 8', 'Class 10', 'Class 12'], isActive: false, autoApply: true, notifyParent: false, notifyStudent: true }
    ];
  }

  openForm(): void {
    this.isEditing = false;
    this.formData = {
      name: '',
      restrictionType: '',
      triggerCondition: '',
      daysOverdue: 30,
      minAmount: 0,
      applyTo: [],
      isActive: true,
      autoApply: true,
      notifyParent: true,
      notifyStudent: false
    };
    this.showFormDialog = true;
  }

  editRule(rule: RestrictionRule): void {
    this.isEditing = true;
    this.formData = { ...rule };
    this.showFormDialog = true;
  }

  isFormValid(): boolean {
    return !!(this.formData.name?.trim() && this.formData.restrictionType && this.formData.triggerCondition && this.formData.daysOverdue && this.formData.applyTo?.length);
  }

  saveRule(): void {
    if (this.isEditing) {
      const index = this.rules.findIndex(r => r.id === this.formData.id);
      if (index !== -1) {
        this.rules[index] = { ...this.rules[index], ...this.formData } as RestrictionRule;
      }
      this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Rule updated successfully', life: 3000 });
    } else {
      const newRule: RestrictionRule = {
        ...this.formData as RestrictionRule,
        id: Date.now().toString()
      };
      this.rules.push(newRule);
      this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Rule created successfully', life: 3000 });
    }
    this.showFormDialog = false;
  }

  deleteRule(rule: RestrictionRule): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${rule.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.rules = this.rules.filter(r => r.id !== rule.id);
        this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: 'Rule deleted', life: 3000 });
      }
    });
  }

  toggleRule(rule: RestrictionRule): void {
    this.messageService.add({
      severity: rule.isActive ? 'success' : 'info',
      summary: rule.isActive ? 'Rule Activated' : 'Rule Deactivated',
      detail: rule.name,
      life: 3000
    });
  }
}
