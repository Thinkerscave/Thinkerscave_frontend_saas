import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { PickListModule } from 'primeng/picklist';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { FeeStorageService, FeeHead as StoredFeeHead } from '../../../services/fee-storage.service';

interface FeeHead {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultAmount: number;
  frequency: string;
}

@Component({
  selector: 'app-fee-group-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule, InputNumberModule,
    TextareaModule, DividerModule, ToastModule, PickListModule,
    TableModule, TagModule, ToggleSwitchModule
  ],
  providers: [MessageService],
  template: `
    <div class="fee-group-form">
      <p-toast></p-toast>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-th-large"></i> {{ isEdit ? 'Edit' : 'Create' }} Fee Group</h2>
          <p class="subtitle">Bundle multiple fee heads into a package for easy assignment</p>
        </div>
        <button pButton label="Back to List" icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
      </div>

      <form [formGroup]="groupForm" (ngSubmit)="onSubmit()">
        <!-- Basic Information -->
        <div class="form-section">
          <h3><i class="pi pi-info-circle"></i> Group Details</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="code">Group Code <span class="required">*</span></label>
              <input id="code" type="text" pInputText formControlName="code" 
                     placeholder="e.g., GRP001" class="w-full" [style]="{'text-transform': 'uppercase'}" />
              <small *ngIf="groupForm.get('code')?.invalid && groupForm.get('code')?.touched" class="p-error">
                Code is required
              </small>
            </div>

            <div class="form-field">
              <label for="name">Group Name <span class="required">*</span></label>
              <input id="name" type="text" pInputText formControlName="name" 
                     placeholder="e.g., Regular Admission Package" class="w-full" />
              <small *ngIf="groupForm.get('name')?.invalid && groupForm.get('name')?.touched" class="p-error">
                Name is required
              </small>
            </div>
          </div>

          <div class="form-field full-width">
            <label for="description">Description</label>
            <textarea id="description" pTextarea formControlName="description" rows="2"
                      placeholder="Brief description of this fee group" class="w-full"></textarea>
          </div>

          <div class="toggle-row">
            <p-toggleswitch formControlName="isActive" inputId="isActive"></p-toggleswitch>
            <label for="isActive">Active - This group is available for use in fee structures</label>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Fee Heads Selection -->
        <div class="form-section">
          <h3><i class="pi pi-list"></i> Select Fee Heads</h3>
          <p class="section-desc">Move fee heads from available list to selected list to include them in this group</p>
          
          <p-pickList [source]="availableFeeHeads" [target]="selectedFeeHeads" 
                      sourceHeader="Available Fee Heads" targetHeader="Selected Fee Heads"
                      [dragdrop]="true" [responsive]="true" filterBy="name"
                      sourceFilterPlaceholder="Search available" targetFilterPlaceholder="Search selected"
                      [showSourceControls]="false" [showTargetControls]="false"
                      [sourceStyle]="{'height':'300px'}" [targetStyle]="{'height':'300px'}">
            <ng-template let-head pTemplate="item">
              <div class="fee-head-item">
                <div class="head-info">
                  <span class="head-code">{{ head.code }}</span>
                  <span class="head-name">{{ head.name }}</span>
                </div>
                <div class="head-meta">
                  <p-tag [value]="head.category" severity="info" [style]="{'font-size': '0.7rem'}"></p-tag>
                  <span class="head-amount">₹{{ head.defaultAmount | number }}</span>
                </div>
              </div>
            </ng-template>
          </p-pickList>
        </div>

        <p-divider></p-divider>

        <!-- Summary -->
        <div class="form-section" *ngIf="selectedFeeHeads.length > 0">
          <h3><i class="pi pi-chart-bar"></i> Group Summary</h3>
          
          <div class="summary-grid">
            <div class="summary-card">
              <span class="summary-label">Total Fee Heads</span>
              <span class="summary-value">{{ selectedFeeHeads.length }}</span>
            </div>
            <div class="summary-card">
              <span class="summary-label">Total Amount</span>
              <span class="summary-value amount">₹{{ getTotalAmount() | number }}</span>
            </div>
          </div>

          <h4>Selected Fee Heads</h4>
          <p-table [value]="selectedFeeHeads" styleClass="p-datatable-sm p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Frequency</th>
                <th>Amount</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-head>
              <tr>
                <td><code>{{ head.code }}</code></td>
                <td>{{ head.name }}</td>
                <td><p-tag [value]="head.category" severity="info"></p-tag></td>
                <td>{{ head.frequency }}</td>
                <td class="amount-cell">₹{{ head.defaultAmount | number }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr>
                <td colspan="4" class="text-right"><strong>Total:</strong></td>
                <td class="amount-cell"><strong>₹{{ getTotalAmount() | number }}</strong></td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button pButton type="button" label="Cancel" class="p-button-text p-button-secondary" (click)="goBack()"></button>
          <button pButton type="submit" label="{{ isEdit ? 'Update' : 'Create' }} Fee Group" icon="pi pi-save" 
                  [disabled]="groupForm.invalid || selectedFeeHeads.length === 0"></button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .fee-group-form { padding: 1.5rem; max-width: 1100px; }
    
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; color: #1e293b; }
    .subtitle { margin: 0.25rem 0 0; color: #64748b; }
    
    .form-section { 
      background: #ffffff; 
      border-radius: 12px; 
      padding: 1.5rem; 
      margin-bottom: 1rem;
      border: 1px solid #e2e8f0;
    }
    
    .form-section h3 { 
      margin: 0 0 1rem; 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      color: #334155;
      font-size: 1.1rem;
    }
    
    .form-section h3 i { color: #6366f1; }
    .form-section h4 { margin: 1.5rem 0 1rem; color: #475569; }
    
    .section-desc { 
      color: #64748b; 
      font-size: 0.875rem; 
      margin: 0 0 1.5rem; 
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field.full-width { grid-column: 1 / -1; margin-bottom: 1rem; }
    
    .form-field label { 
      font-weight: 500; 
      color: #475569; 
      font-size: 0.875rem; 
    }
    
    .required { color: #ef4444; }
    .p-error { color: #ef4444; font-size: 0.75rem; }
    
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    .toggle-row label { 
      font-weight: 500; 
      color: #334155; 
      cursor: pointer; 
    }
    
    .fee-head-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0.5rem 0;
    }
    
    .head-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .head-code {
      font-family: monospace;
      font-size: 0.75rem;
      color: #64748b;
    }
    
    .head-name {
      font-weight: 500;
      color: #334155;
    }
    
    .head-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    
    .head-amount {
      font-weight: 600;
      color: #10b981;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .summary-card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border: 1px solid #e2e8f0;
    }
    
    .summary-label { color: #64748b; font-size: 0.875rem; }
    .summary-value { font-size: 1.5rem; font-weight: 700; color: #334155; }
    .summary-value.amount { color: #10b981; }
    
    .amount-cell { 
      font-weight: 600; 
      color: #10b981; 
      text-align: right; 
    }
    
    .text-right { text-align: right; }
    
    code {
      background: #f1f5f9;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
    
    .w-full { width: 100%; }
    
    @media (max-width: 768px) {
      .form-grid, .summary-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class FeeGroupFormComponent implements OnInit {
  isEdit = false;
  groupId: string | null = null;
  groupForm!: FormGroup;

  availableFeeHeads: FeeHead[] = [];
  selectedFeeHeads: FeeHead[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private feeStorage: FeeStorageService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAvailableFeeHeads();

    this.groupId = this.route.snapshot.paramMap.get('id');
    if (this.groupId) {
      this.isEdit = true;
      this.loadFeeGroup(this.groupId);
    }
  }

  initForm(): void {
    this.groupForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  loadAvailableFeeHeads(): void {
    // Load fee heads from storage and map to local interface
    const storedHeads = this.feeStorage.getFeeHeads();
    if (storedHeads.length > 0) {
      this.availableFeeHeads = storedHeads.map(h => ({
        id: h.id,
        code: h.code,
        name: h.name,
        category: h.category,
        defaultAmount: h.defaultAmount,
        frequency: h.frequency
      }));
    } else {
      // Fallback mock data if no fee heads exist
      this.availableFeeHeads = [
        { id: 'mock1', code: 'TUI001', name: 'Tuition Fee', category: 'ACADEMIC', defaultAmount: 50000, frequency: 'YEARLY' },
        { id: 'mock2', code: 'LAB001', name: 'Laboratory Fee', category: 'ACADEMIC', defaultAmount: 5000, frequency: 'YEARLY' },
        { id: 'mock3', code: 'LIB001', name: 'Library Fee', category: 'ACADEMIC', defaultAmount: 2000, frequency: 'YEARLY' }
      ];
    }
  }

  loadFeeGroup(id: string): void {
    const group = this.feeStorage.getFeeGroup(id);
    if (group) {
      this.groupForm.patchValue({
        code: group.code,
        name: group.name,
        description: group.description,
        isActive: group.isActive
      });

      // Move selected heads from available to selected
      const selectedIds = group.feeHeadIds || [];
      this.selectedFeeHeads = this.availableFeeHeads.filter(h => selectedIds.includes(h.id));
      this.availableFeeHeads = this.availableFeeHeads.filter(h => !selectedIds.includes(h.id));
    }
  }

  getTotalAmount(): number {
    return this.selectedFeeHeads.reduce((sum, head) => sum + head.defaultAmount, 0);
  }

  goBack(): void {
    const navigatePath = this.isEdit ? '../../' : '../';
    this.router.navigate([navigatePath], { relativeTo: this.route });
  }

  onSubmit(): void {
    if (this.groupForm.valid && this.selectedFeeHeads.length > 0) {
      const formData = {
        ...this.groupForm.value,
        feeHeadIds: this.selectedFeeHeads.map(h => h.id),
        totalAmount: this.getTotalAmount(),
        id: this.groupId || undefined
      };

      this.feeStorage.saveFeeGroup(formData);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: this.isEdit ? 'Fee group updated successfully' : 'Fee group created successfully',
        life: 3000
      });

      setTimeout(() => {
        this.goBack();
      }, 1500);
    }
  }
}
