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
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FeeStorageService } from '../../../services/fee-storage.service';

@Component({
  selector: 'app-fee-policy-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule, InputNumberModule,
    DropdownModule, CheckboxModule, CalendarModule, TextareaModule,
    DividerModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="fee-policy-form">
      <p-toast></p-toast>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-file-edit"></i> {{ isEdit ? 'Edit' : 'Create' }} Fee Policy</h2>
          <p class="subtitle">Define fee policies for academic session including late fees and installment rules</p>
        </div>
        <button pButton label="Back to List" icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
      </div>

      <form [formGroup]="policyForm" (ngSubmit)="onSubmit()">
        <!-- Basic Information -->
        <div class="form-section">
          <h3><i class="pi pi-info-circle"></i> Basic Information</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="name">Policy Name <span class="required">*</span></label>
              <input id="name" type="text" pInputText formControlName="name" 
                     placeholder="e.g., Academic Year 2025-26 Policy" class="w-full" />
              <small *ngIf="policyForm.get('name')?.invalid && policyForm.get('name')?.touched" class="p-error">
                Policy name is required
              </small>
            </div>

            <div class="form-field">
              <label for="academicSession">Academic Session <span class="required">*</span></label>
              <p-dropdown id="academicSession" [options]="academicSessions" formControlName="academicSession"
                          placeholder="Select Session" optionLabel="label" optionValue="value" 
                          [style]="{'width':'100%'}"></p-dropdown>
            </div>

            <div class="form-field">
              <label for="effectiveFrom">Effective From <span class="required">*</span></label>
              <p-calendar id="effectiveFrom" formControlName="effectiveFrom" [showIcon]="true"
                          dateFormat="dd/mm/yy" [style]="{'width':'100%'}"></p-calendar>
            </div>

            <div class="form-field">
              <label for="effectiveTo">Effective To</label>
              <p-calendar id="effectiveTo" formControlName="effectiveTo" [showIcon]="true"
                          dateFormat="dd/mm/yy" [style]="{'width':'100%'}"></p-calendar>
            </div>
          </div>

          <div class="form-field full-width">
            <label for="description">Description</label>
            <textarea id="description" pTextarea formControlName="description" rows="3"
                      placeholder="Brief description of this fee policy" class="w-full"></textarea>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Late Fee Configuration -->
        <div class="form-section">
          <h3><i class="pi pi-clock"></i> Late Fee Configuration</h3>
          
          <div class="toggle-row">
            <p-checkbox formControlName="lateFeeEnabled" [binary]="true" inputId="lateFeeEnabled"></p-checkbox>
            <label for="lateFeeEnabled">Enable Late Fee Charges</label>
          </div>

          <div class="form-grid" *ngIf="policyForm.get('lateFeeEnabled')?.value">
            <div class="form-field">
              <label for="lateFeeType">Late Fee Type</label>
              <p-dropdown id="lateFeeType" [options]="lateFeeTypes" formControlName="lateFeeType"
                          placeholder="Select Type" optionLabel="label" optionValue="value"
                          [style]="{'width':'100%'}"></p-dropdown>
            </div>

            <div class="form-field">
              <label for="lateFeeAmount">Late Fee Amount (₹)</label>
              <p-inputNumber id="lateFeeAmount" formControlName="lateFeeAmount" mode="currency" 
                             currency="INR" locale="en-IN" [style]="{'width':'100%'}"></p-inputNumber>
            </div>

            <div class="form-field">
              <label for="gracePeriodDays">Grace Period (Days)</label>
              <p-inputNumber id="gracePeriodDays" formControlName="gracePeriodDays" 
                             [min]="0" [max]="30" [style]="{'width':'100%'}"></p-inputNumber>
            </div>

            <div class="form-field">
              <label for="maxLateFee">Maximum Late Fee Cap (₹)</label>
              <p-inputNumber id="maxLateFee" formControlName="maxLateFee" mode="currency"
                             currency="INR" locale="en-IN" [style]="{'width':'100%'}"></p-inputNumber>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Installment Configuration -->
        <div class="form-section">
          <h3><i class="pi pi-calendar-plus"></i> Installment Configuration</h3>
          
          <div class="toggle-row">
            <p-checkbox formControlName="installmentsAllowed" [binary]="true" inputId="installmentsAllowed"></p-checkbox>
            <label for="installmentsAllowed">Allow Installment Payments</label>
          </div>

          <div class="form-grid" *ngIf="policyForm.get('installmentsAllowed')?.value">
            <div class="form-field">
              <label for="maxInstallments">Maximum Installments</label>
              <p-inputNumber id="maxInstallments" formControlName="maxInstallments" 
                             [min]="2" [max]="12" [style]="{'width':'100%'}"></p-inputNumber>
            </div>

            <div class="form-field">
              <label for="minInstallmentAmount">Minimum Installment Amount (₹)</label>
              <p-inputNumber id="minInstallmentAmount" formControlName="minInstallmentAmount" mode="currency"
                             currency="INR" locale="en-IN" [style]="{'width':'100%'}"></p-inputNumber>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Refund Policy -->
        <div class="form-section">
          <h3><i class="pi pi-replay"></i> Refund Policy</h3>
          
          <div class="toggle-row">
            <p-checkbox formControlName="refundAllowed" [binary]="true" inputId="refundAllowed"></p-checkbox>
            <label for="refundAllowed">Allow Refunds</label>
          </div>

          <div class="form-grid" *ngIf="policyForm.get('refundAllowed')?.value">
            <div class="form-field">
              <label for="refundDeductionPercent">Deduction Percentage (%)</label>
              <p-inputNumber id="refundDeductionPercent" formControlName="refundDeductionPercent"
                             [min]="0" [max]="100" suffix="%" [style]="{'width':'100%'}"></p-inputNumber>
            </div>

            <div class="form-field">
              <label for="refundProcessingDays">Processing Days</label>
              <p-inputNumber id="refundProcessingDays" formControlName="refundProcessingDays"
                             [min]="1" [max]="90" [style]="{'width':'100%'}"></p-inputNumber>
            </div>
          </div>

          <div class="form-field full-width" *ngIf="policyForm.get('refundAllowed')?.value">
            <label for="refundTerms">Refund Terms & Conditions</label>
            <textarea id="refundTerms" pTextarea formControlName="refundTerms" rows="3"
                      placeholder="Specify refund terms and conditions" class="w-full"></textarea>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button pButton type="button" label="Cancel" class="p-button-text p-button-secondary" (click)="goBack()"></button>
          <button pButton type="button" label="Save as Draft" icon="pi pi-save" class="p-button-secondary"
                  (click)="saveAsDraft()"></button>
          <button pButton type="submit" label="Publish Policy" icon="pi pi-check" 
                  [disabled]="policyForm.invalid"></button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .fee-policy-form { padding: 1.5rem; max-width: 1000px; }
    
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
    
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    .toggle-row label { 
      font-weight: 500; 
      color: #334155; 
      cursor: pointer; 
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
    
    .p-error { color: #ef4444; font-size: 0.75rem; }
    
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class FeePolicyFormComponent implements OnInit {
  isEdit = false;
  policyId: string | null = null;
  policyForm!: FormGroup;

  academicSessions = [
    { label: '2024-25', value: '2024-25' },
    { label: '2025-26', value: '2025-26' },
    { label: '2026-27', value: '2026-27' }
  ];

  lateFeeTypes = [
    { label: 'Fixed Amount', value: 'FIXED' },
    { label: 'Percentage of Due', value: 'PERCENTAGE' },
    { label: 'Per Day Fixed', value: 'PER_DAY' }
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

    this.policyId = this.route.snapshot.paramMap.get('id');
    if (this.policyId) {
      this.isEdit = true;
      this.loadPolicy(this.policyId);
    }
  }

  initForm(): void {
    this.policyForm = this.fb.group({
      name: ['', Validators.required],
      academicSession: ['', Validators.required],
      effectiveFrom: [new Date(), Validators.required],
      effectiveTo: [null],
      description: [''],
      lateFeeEnabled: [false],
      lateFeeType: ['FIXED'],
      lateFeeAmount: [100],
      gracePeriodDays: [7],
      maxLateFee: [1000],
      installmentsAllowed: [true],
      maxInstallments: [4],
      minInstallmentAmount: [5000],
      refundAllowed: [true],
      refundDeductionPercent: [10],
      refundProcessingDays: [15],
      refundTerms: ['']
    });
  }

  loadPolicy(id: string): void {
    const policy = this.feeStorage.getPolicy(id);
    if (policy) {
      this.policyForm.patchValue({
        name: policy.name,
        academicSession: policy.academicSession,
        effectiveFrom: new Date(policy.effectiveFrom),
        effectiveTo: policy.effectiveTo ? new Date(policy.effectiveTo) : null,
        description: policy.description,
        lateFeeEnabled: policy.lateFeeEnabled,
        lateFeeType: policy.lateFeeType,
        lateFeeAmount: policy.lateFeeAmount,
        gracePeriodDays: policy.gracePeriodDays,
        maxLateFee: policy.maxLateFee,
        installmentsAllowed: policy.installmentsAllowed,
        maxInstallments: policy.maxInstallments,
        minInstallmentAmount: policy.minInstallmentAmount,
        refundAllowed: policy.refundAllowed,
        refundDeductionPercent: policy.refundDeductionPercent,
        refundProcessingDays: policy.refundProcessingDays,
        refundTerms: policy.refundTerms
      });
    }
  }

  goBack(): void {
    const navigatePath = this.isEdit ? '../../' : '../';
    this.router.navigate([navigatePath], { relativeTo: this.route });
  }

  saveAsDraft(): void {
    const formData = this.policyForm.value;
    this.feeStorage.savePolicy({
      ...formData,
      id: this.policyId || undefined,
      status: 'DRAFT'
    });
    this.messageService.add({
      severity: 'info',
      summary: 'Saved as Draft',
      detail: 'Policy has been saved as draft',
      life: 3000
    });
  }

  onSubmit(): void {
    if (this.policyForm.valid) {
      const formData = this.policyForm.value;
      this.feeStorage.savePolicy({
        ...formData,
        id: this.policyId || undefined,
        status: 'ACTIVE'
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: this.isEdit ? 'Policy updated successfully' : 'Policy created successfully',
        life: 3000
      });

      setTimeout(() => {
        this.goBack();
      }, 1500);
    }
  }
}
