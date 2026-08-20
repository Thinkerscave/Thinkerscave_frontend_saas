import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { AppToastComponent } from '../../../../../core/feedback/app-toast.component';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { StepsModule } from 'primeng/steps';
import { MessageService, MenuItem } from 'primeng/api';
import { FeeStorageService } from '../../../services/fee-storage.service';

@Component({
  selector: 'app-fee-structure-form',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AppToastComponent, 
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule, InputNumberModule,
    DropdownModule, CalendarModule, TextareaModule, DividerModule, TableModule, TagModule, ToggleSwitchModule, StepsModule
  ],
  providers: [MessageService],
  template: `
    <div class="fee-structure-form">
      <app-toast></app-toast>
      
      <div class="page-header">
        <div>
          <h2><i class="pi pi-sitemap"></i> {{ isEdit ? 'Edit' : 'Create' }} Fee Structure</h2>
          <p class="subtitle">Map fee groups to classes/programs with specific amounts and due dates</p>
        </div>
        <button pButton label="Back to List" icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
      </div>

      <form [formGroup]="structureForm" (ngSubmit)="onSubmit()">
        <!-- Basic Information -->
        <div class="form-section">
          <h3><i class="pi pi-info-circle"></i> Structure Details</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="name">Structure Name <span class="required">*</span></label>
              <input id="name" type="text" pInputText formControlName="name" 
                     placeholder="e.g., Class 10 - Regular 2025-26" class="w-full" />
              <small *ngIf="structureForm.get('name')?.invalid && structureForm.get('name')?.touched" class="p-error">
                Name is required
              </small>
            </div>

            <div class="form-field">
              <label for="academicYear">Academic Year <span class="required">*</span></label>
              <p-dropdown id="academicYear" [options]="academicYears" formControlName="academicYear"
                          placeholder="Select Year" optionLabel="label" optionValue="value" 
                          [style]="{'width':'100%'}"></p-dropdown>
            </div>

            <div class="form-field">
              <label for="classProgram">Class/Program <span class="required">*</span></label>
              <p-dropdown id="classProgram" [options]="classes" formControlName="classProgram"
                          placeholder="Select Class" optionLabel="label" optionValue="value"
                          [style]="{'width':'100%'}"></p-dropdown>
            </div>

            <div class="form-field">
              <label for="feeGroup">Fee Group <span class="required">*</span></label>
              <p-dropdown id="feeGroup" [options]="feeGroups" formControlName="feeGroup"
                          placeholder="Select Fee Group" optionLabel="label" optionValue="value"
                          [style]="{'width':'100%'}" (onChange)="onFeeGroupChange($event)"></p-dropdown>
            </div>
          </div>

          <div class="form-field full-width">
            <label for="description">Description</label>
            <textarea id="description" pInputTextarea formControlName="description" rows="2"
                      placeholder="Additional notes about this fee structure" class="w-full"></textarea>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Fee Breakdown -->
        <div class="form-section" *ngIf="feeBreakdown.length > 0">
          <h3><i class="pi pi-list"></i> Fee Breakdown</h3>
          <p class="section-desc">Customize amounts for each fee head in this structure</p>
          
          <p-table [value]="feeBreakdown" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Fee Head</th>
                <th>Category</th>
                <th>Default Amount</th>
                <th>Custom Amount</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item let-i="rowIndex">
              <tr>
                <td>
                  <strong>{{ item.name }}</strong>
                  <div class="code-text">{{ item.code }}</div>
                </td>
                <td><p-tag [value]="item.category" severity="info"></p-tag></td>
                <td>₹{{ item.defaultAmount | number }}</td>
                <td>
                  <p-inputNumber [(ngModel)]="item.customAmount" [ngModelOptions]="{standalone: true}"
                                 mode="currency" currency="INR" locale="en-IN"
                                 [style]="{'width':'150px'}"></p-inputNumber>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr>
                <td colspan="3" class="text-right"><strong>Total Structure Amount:</strong></td>
                <td><strong class="total-amount">₹{{ getTotalAmount() | number }}</strong></td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <p-divider></p-divider>

        <!-- Installment Schedule -->
        <div class="form-section">
          <div class="section-header">
            <h3><i class="pi pi-calendar"></i> Installment Schedule</h3>
            <button pButton type="button" label="Add Installment" icon="pi pi-plus" 
                    class="p-button-sm p-button-outlined" (click)="addInstallment()"></button>
          </div>
          
          <div class="installments-container" formArrayName="installments">
            <div class="installment-card" *ngFor="let inst of installments.controls; let i = index">
              <div class="installment-header">
                <span class="installment-number">Installment {{ i + 1 }}</span>
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                        (click)="removeInstallment(i)" *ngIf="installments.length > 1"></button>
              </div>
              
              <div class="installment-grid" [formGroupName]="i">
                <div class="form-field">
                  <label>Installment Name</label>
                  <input type="text" pInputText formControlName="name" placeholder="e.g., First Quarter" class="w-full" />
                </div>
                
                <div class="form-field">
                  <label>Amount (₹)</label>
                  <p-inputNumber formControlName="amount" mode="currency" currency="INR" locale="en-IN"
                                 [style]="{'width':'100%'}"></p-inputNumber>
                </div>
                
                <div class="form-field">
                  <label>Due Date</label>
                  <p-calendar formControlName="dueDate" [showIcon]="true" dateFormat="dd/mm/yy"
                              [style]="{'width':'100%'}"></p-calendar>
                </div>

                <div class="form-field">
                  <label>Percentage (%)</label>
                  <p-inputNumber formControlName="percentage" [min]="0" [max]="100" suffix="%"
                                 [style]="{'width':'100%'}"></p-inputNumber>
                </div>
              </div>
            </div>
          </div>

          <div class="installment-summary" *ngIf="installments.length > 0">
            <div class="summary-item">
              <span>Total Installments:</span>
              <strong>{{ installments.length }}</strong>
            </div>
            <div class="summary-item">
              <span>Total Scheduled:</span>
              <strong>₹{{ getInstallmentTotal() | number }}</strong>
            </div>
            <div class="summary-item" [class.mismatch]="getInstallmentTotal() !== getTotalAmount()">
              <span>Remaining:</span>
              <strong>₹{{ getTotalAmount() - getInstallmentTotal() | number }}</strong>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Settings -->
        <div class="form-section">
          <h3><i class="pi pi-cog"></i> Settings</h3>
          
          <div class="settings-row">
            <div class="setting-item">
              <p-toggleswitch formControlName="isActive" inputId="isActive"></p-toggleswitch>
              <label for="isActive">Active - Available for contract generation</label>
            </div>
            
            <div class="setting-item">
              <p-toggleswitch formControlName="allowCustomization" inputId="allowCustomization"></p-toggleswitch>
              <label for="allowCustomization">Allow per-student customization</label>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button pButton type="button" label="Cancel" class="p-button-text p-button-secondary" (click)="goBack()"></button>
          <button pButton type="button" label="Save as Draft" icon="pi pi-save" class="p-button-secondary"
                  (click)="saveAsDraft()"></button>
          <button pButton type="submit" label="{{ isEdit ? 'Update' : 'Create' }} Structure" icon="pi pi-check" 
                  [disabled]="structureForm.invalid"></button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .fee-structure-form { padding: 1.5rem; max-width: 1100px; }
    
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
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .section-header h3 { margin: 0; }
    
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
    .form-field.full-width { grid-column: 1 / -1; }
    
    .form-field label { 
      font-weight: 500; 
      color: #475569; 
      font-size: 0.875rem; 
    }
    
    .required { color: #ef4444; }
    .p-error { color: #ef4444; font-size: 0.75rem; }
    
    .code-text { font-size: 0.75rem; color: #64748b; font-family: monospace; }
    
    .text-right { text-align: right; }
    .total-amount { color: #10b981; font-size: 1.25rem; }
    
    .installments-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .installment-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
    }
    
    .installment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .installment-number {
      font-weight: 600;
      color: #6366f1;
    }
    
    .installment-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    
    .installment-summary {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #f1f5f9;
      border-radius: 8px;
    }
    
    .summary-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .summary-item span { color: #64748b; }
    .summary-item strong { color: #334155; }
    .summary-item.mismatch strong { color: #ef4444; }
    
    .settings-row {
      display: flex;
      gap: 2rem;
    }
    
    .setting-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      flex: 1;
    }
    
    .setting-item label { 
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
    
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .installment-grid { grid-template-columns: repeat(2, 1fr); }
      .settings-row { flex-direction: column; gap: 1rem; }
      .installment-summary { flex-direction: column; gap: 0.5rem; }
      .page-header { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class FeeStructureFormComponent implements OnInit {
  isEdit = false;
  structureId: string | null = null;
  structureForm!: FormGroup;
  feeBreakdown: any[] = [];

  academicYears = [
    { label: '2024-25', value: '2024-25' },
    { label: '2025-26', value: '2025-26' },
    { label: '2026-27', value: '2026-27' }
  ];

  classes = [
    { label: 'Class 1', value: 'CLASS_1' },
    { label: 'Class 2', value: 'CLASS_2' },
    { label: 'Class 3', value: 'CLASS_3' },
    { label: 'Class 4', value: 'CLASS_4' },
    { label: 'Class 5', value: 'CLASS_5' },
    { label: 'Class 6', value: 'CLASS_6' },
    { label: 'Class 7', value: 'CLASS_7' },
    { label: 'Class 8', value: 'CLASS_8' },
    { label: 'Class 9', value: 'CLASS_9' },
    { label: 'Class 10', value: 'CLASS_10' },
    { label: 'Class 11 - Science', value: 'CLASS_11_SCI' },
    { label: 'Class 11 - Commerce', value: 'CLASS_11_COM' },
    { label: 'Class 12 - Science', value: 'CLASS_12_SCI' },
    { label: 'Class 12 - Commerce', value: 'CLASS_12_COM' }
  ];

  feeGroups = [
    { label: 'Regular Admission Package', value: 'GRP001' },
    { label: 'Day Scholar Package', value: 'GRP002' },
    { label: 'Hostel Package', value: 'GRP003' }
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

    this.structureId = this.route.snapshot.paramMap.get('id');
    if (this.structureId) {
      this.isEdit = true;
      this.loadStructure(this.structureId);
    }
  }

  initForm(): void {
    this.structureForm = this.fb.group({
      name: ['', Validators.required],
      academicYear: ['2025-26', Validators.required],
      classProgram: ['', Validators.required],
      feeGroup: ['', Validators.required],
      description: [''],
      isActive: [true],
      allowCustomization: [false],
      installments: this.fb.array([])
    });

    // Add default installment
    this.addInstallment();
  }

  get installments(): FormArray {
    return this.structureForm.get('installments') as FormArray;
  }

  addInstallment(): void {
    const installmentGroup = this.fb.group({
      name: [''],
      amount: [0],
      dueDate: [null],
      percentage: [0]
    });
    this.installments.push(installmentGroup);
  }

  removeInstallment(index: number): void {
    this.installments.removeAt(index);
  }

  onFeeGroupChange(event: any): void {
    // Mock loading fee breakdown based on selected group
    const groupId = event.value;
    if (groupId === 'GRP001') {
      this.feeBreakdown = [
        { code: 'TUI001', name: 'Tuition Fee', category: 'ACADEMIC', defaultAmount: 50000, customAmount: 50000 },
        { code: 'LAB001', name: 'Laboratory Fee', category: 'ACADEMIC', defaultAmount: 5000, customAmount: 5000 },
        { code: 'LIB001', name: 'Library Fee', category: 'ACADEMIC', defaultAmount: 2000, customAmount: 2000 },
        { code: 'EXM001', name: 'Examination Fee', category: 'ACADEMIC', defaultAmount: 2500, customAmount: 2500 }
      ];
    } else if (groupId === 'GRP002') {
      this.feeBreakdown = [
        { code: 'TUI001', name: 'Tuition Fee', category: 'ACADEMIC', defaultAmount: 50000, customAmount: 50000 },
        { code: 'LIB001', name: 'Library Fee', category: 'ACADEMIC', defaultAmount: 2000, customAmount: 2000 },
        { code: 'EXM001', name: 'Examination Fee', category: 'ACADEMIC', defaultAmount: 2500, customAmount: 2500 }
      ];
    } else {
      this.feeBreakdown = [];
    }
  }

  loadStructure(id: string): void {
    const structure = this.feeStorage.getFeeStructure(id);
    if (structure) {
      this.structureForm.patchValue({
        name: structure.name,
        academicYear: structure.academicYear,
        classProgram: structure.classProgram,
        feeGroup: structure.feeGroup,
        description: structure.description,
        isActive: structure.isActive,
        allowCustomization: structure.allowCustomization
      });

      // Load fee breakdown
      this.feeBreakdown = structure.feeBreakdown || [];

      // Clear and load installments
      while (this.installments.length) {
        this.installments.removeAt(0);
      }

      const savedInstallments = structure.installments || [];
      savedInstallments.forEach((inst: any) => {
        this.installments.push(this.fb.group({
          name: inst.name || '',
          amount: inst.amount || 0,
          dueDate: inst.dueDate ? new Date(inst.dueDate) : null,
          percentage: inst.percentage || 0
        }));
      });
    }
  }

  getTotalAmount(): number {
    return this.feeBreakdown.reduce((sum, item) => sum + (item.customAmount || 0), 0);
  }

  getInstallmentTotal(): number {
    return this.installments.controls.reduce((sum, ctrl) => sum + (ctrl.get('amount')?.value || 0), 0);
  }

  saveAsDraft(): void {
    const formData = this.structureForm.value;
    this.feeStorage.saveFeeStructure({
      ...formData,
      id: this.structureId || undefined,
      feeBreakdown: this.feeBreakdown,
      installments: this.installments.value,
      totalAmount: this.getTotalAmount(),
      isActive: false
    });
    this.messageService.add({
      severity: 'info',
      summary: 'Saved as Draft',
      detail: 'Fee structure has been saved as draft',
      life: 3000
    });
  }

  goBack(): void {
    const navigatePath = this.isEdit ? '../../' : '../';
    this.router.navigate([navigatePath], { relativeTo: this.route });
  }

  onSubmit(): void {
    if (this.structureForm.valid) {
      const formData = this.structureForm.value;
      this.feeStorage.saveFeeStructure({
        ...formData,
        id: this.structureId || undefined,
        feeBreakdown: this.feeBreakdown,
        installments: this.installments.value,
        totalAmount: this.getTotalAmount()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: this.isEdit ? 'Fee structure updated successfully' : 'Fee structure created successfully',
        life: 3000
      });

      setTimeout(() => {
        this.goBack();
      }, 1500);
    }
  }
}
