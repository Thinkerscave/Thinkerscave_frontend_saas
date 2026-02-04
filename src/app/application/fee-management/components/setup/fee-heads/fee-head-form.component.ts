import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { FeeStorageService } from '../../../services/fee-storage.service';

@Component({
  selector: 'app-fee-head-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule, InputNumberModule,
    DropdownModule, CheckboxModule, TextareaModule, DividerModule,
    ToastModule, ToggleSwitchModule
  ],
  providers: [MessageService],
  template: `
    <div class="fee-head-form">
      <p-toast></p-toast>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-list"></i> {{ isEdit ? 'Edit' : 'Create' }} Fee Head</h2>
          <p class="subtitle">Define individual fee components like Tuition, Lab Fee, Library, etc.</p>
        </div>
        <button pButton label="Back to List" icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
      </div>

      <form [formGroup]="headForm" (ngSubmit)="onSubmit()">
        <!-- Basic Information -->
        <div class="form-section">
          <h3><i class="pi pi-info-circle"></i> Fee Head Details</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="code">Fee Head Code <span class="required">*</span></label>
              <input id="code" type="text" pInputText formControlName="code" 
                     placeholder="e.g., TUI001" class="w-full" [style]="{'text-transform': 'uppercase'}" />
              <small class="hint">Unique identifier for this fee head</small>
              <small *ngIf="headForm.get('code')?.invalid && headForm.get('code')?.touched" class="p-error">
                Code is required
              </small>
            </div>

            <div class="form-field">
              <label for="name">Fee Head Name <span class="required">*</span></label>
              <input id="name" type="text" pInputText formControlName="name" 
                     placeholder="e.g., Tuition Fee" class="w-full" />
              <small *ngIf="headForm.get('name')?.invalid && headForm.get('name')?.touched" class="p-error">
                Name is required
              </small>
            </div>

            <div class="form-field">
              <label for="category">Category <span class="required">*</span></label>
              <p-dropdown id="category" [options]="categories" formControlName="category"
                          placeholder="Select Category" optionLabel="label" optionValue="value" 
                          [style]="{'width':'100%'}"></p-dropdown>
            </div>

            <div class="form-field">
              <label for="frequency">Payment Frequency <span class="required">*</span></label>
              <p-dropdown id="frequency" [options]="frequencies" formControlName="frequency"
                          placeholder="Select Frequency" optionLabel="label" optionValue="value"
                          [style]="{'width':'100%'}"></p-dropdown>
            </div>
          </div>

          <div class="form-field full-width">
            <label for="description">Description</label>
            <textarea id="description" pTextarea formControlName="description" rows="2"
                      placeholder="Brief description of this fee head" class="w-full"></textarea>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Pricing Configuration -->
        <div class="form-section">
          <h3><i class="pi pi-indian-rupee"></i> Pricing Configuration</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="defaultAmount">Default Amount (₹) <span class="required">*</span></label>
              <p-inputNumber id="defaultAmount" formControlName="defaultAmount" mode="currency" 
                             currency="INR" locale="en-IN" [style]="{'width':'100%'}"></p-inputNumber>
              <small class="hint">Base amount for this fee head</small>
            </div>

            <div class="form-field">
              <label for="minAmount">Minimum Amount (₹)</label>
              <p-inputNumber id="minAmount" formControlName="minAmount" mode="currency" 
                             currency="INR" locale="en-IN" [style]="{'width':'100%'}"></p-inputNumber>
            </div>

            <div class="form-field">
              <label for="maxAmount">Maximum Amount (₹)</label>
              <p-inputNumber id="maxAmount" formControlName="maxAmount" mode="currency" 
                             currency="INR" locale="en-IN" [style]="{'width':'100%'}"></p-inputNumber>
            </div>

            <div class="form-field">
              <label for="taxPercent">Tax Percentage (%)</label>
              <p-inputNumber id="taxPercent" formControlName="taxPercent"
                             [min]="0" [max]="30" suffix="%" [style]="{'width':'100%'}"></p-inputNumber>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Settings -->
        <div class="form-section">
          <h3><i class="pi pi-cog"></i> Settings</h3>
          
          <div class="settings-grid">
            <div class="setting-item">
              <p-toggleswitch formControlName="isActive" inputId="isActive"></p-toggleswitch>
              <div class="setting-info">
                <label for="isActive">Active</label>
                <span>This fee head is available for use in fee groups</span>
              </div>
            </div>

            <div class="setting-item">
              <p-toggleswitch formControlName="isMandatory" inputId="isMandatory"></p-toggleswitch>
              <div class="setting-info">
                <label for="isMandatory">Mandatory Fee</label>
                <span>This fee cannot be exempted or waived</span>
              </div>
            </div>

            <div class="setting-item">
              <p-toggleswitch formControlName="isRefundable" inputId="isRefundable"></p-toggleswitch>
              <div class="setting-info">
                <label for="isRefundable">Refundable</label>
                <span>This fee can be refunded on withdrawal</span>
              </div>
            </div>

            <div class="setting-item">
              <p-toggleswitch formControlName="allowPartialPayment" inputId="allowPartialPayment"></p-toggleswitch>
              <div class="setting-info">
                <label for="allowPartialPayment">Allow Partial Payment</label>
                <span>Students can pay this fee in installments</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button pButton type="button" label="Cancel" class="p-button-text p-button-secondary" (click)="goBack()"></button>
          <button pButton type="submit" label="{{ isEdit ? 'Update' : 'Create' }} Fee Head" icon="pi pi-save" 
                  [disabled]="headForm.invalid"></button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .fee-head-form { padding: 1.5rem; max-width: 900px; }
    
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
      margin: 0 0 1.5rem; 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      color: #334155;
      font-size: 1.1rem;
    }
    
    .form-section h3 i { color: #6366f1; }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field.full-width { grid-column: 1 / -1; }
    
    .form-field label { 
      font-weight: 500; 
      color: #475569; 
      font-size: 0.875rem; 
    }
    
    .required { color: #ef4444; }
    .hint { color: #94a3b8; font-size: 0.75rem; }
    .p-error { color: #ef4444; font-size: 0.75rem; }
    
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .setting-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .setting-info label {
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }
    
    .setting-info span {
      font-size: 0.75rem;
      color: #64748b;
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
      .form-grid, .settings-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class FeeHeadFormComponent implements OnInit {
  isEdit = false;
  headId: string | null = null;
  headForm!: FormGroup;

  categories = [
    { label: 'Academic', value: 'ACADEMIC' },
    { label: 'Facility', value: 'FACILITY' },
    { label: 'Transport', value: 'TRANSPORT' },
    { label: 'Hostel', value: 'HOSTEL' },
    { label: 'Extra-Curricular', value: 'EXTRA_CURRICULAR' },
    { label: 'Other', value: 'OTHER' }
  ];

  frequencies = [
    { label: 'One-Time', value: 'ONE_TIME' },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Quarterly', value: 'QUARTERLY' },
    { label: 'Half-Yearly', value: 'HALF_YEARLY' },
    { label: 'Yearly', value: 'YEARLY' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private feeStorage: FeeStorageService
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.headId = this.route.snapshot.paramMap.get('id');
    if (this.headId) {
      this.isEdit = true;
      this.loadFeeHead(this.headId);
    }
  }

  initForm(): void {
    this.headForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      category: ['ACADEMIC', Validators.required],
      frequency: ['YEARLY', Validators.required],
      description: [''],
      defaultAmount: [0, Validators.required],
      minAmount: [0],
      maxAmount: [null],
      taxPercent: [0],
      isActive: [true],
      isMandatory: [false],
      isRefundable: [true],
      allowPartialPayment: [true]
    });
  }

  loadFeeHead(id: string): void {
    const head = this.feeStorage.getFeeHead(id);
    if (head) {
      this.headForm.patchValue({
        code: head.code,
        name: head.name,
        category: head.category,
        frequency: head.frequency,
        description: head.description,
        defaultAmount: head.defaultAmount,
        minAmount: head.minAmount,
        maxAmount: head.maxAmount,
        taxPercent: head.taxPercent,
        isActive: head.isActive,
        isMandatory: head.isMandatory,
        isRefundable: head.isRefundable,
        allowPartialPayment: head.allowPartialPayment
      });
    }
  }

  goBack(): void {
    const navigatePath = this.isEdit ? '../../' : '../';
    this.router.navigate([navigatePath], { relativeTo: this.route });
  }

  onSubmit(): void {
    if (this.headForm.valid) {
      const formData = this.headForm.value;
      this.feeStorage.saveFeeHead({
        ...formData,
        id: this.headId || undefined
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: this.isEdit ? 'Fee head updated successfully' : 'Fee head created successfully',
        life: 3000
      });

      setTimeout(() => {
        this.goBack();
      }, 1500);
    }
  }
}
