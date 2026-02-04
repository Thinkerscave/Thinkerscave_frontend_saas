import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  section: string;
  fatherName: string;
  totalFees: number;
  paidFees: number;
  outstandingFees: number;
}

@Component({
  selector: 'app-adjustment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, InputNumberModule, InputTextarea, DropdownModule, AutoCompleteModule, CardModule, DividerModule, ToastModule, TagModule],
  providers: [MessageService],
  template: `
    <div class="adjustment-form">
      <p-toast></p-toast>
      <div class="page-header">
        <div>
          <h2><i class="pi pi-percentage"></i> Create Adjustment</h2>
          <p>Create a fee adjustment request (requires approval)</p>
        </div>
        <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
      </div>

      <div class="form-container">
        <!-- Step 1: Select Student -->
        <div class="form-section">
          <h3><i class="pi pi-user"></i> Select Student</h3>
          <div class="search-field">
            <label>Search Student</label>
            <p-autoComplete [(ngModel)]="selectedStudent" [suggestions]="filteredStudents" (completeMethod)="searchStudents($event)"
                            field="name" [dropdown]="true" placeholder="Search by name or admission no..."
                            [style]="{'width':'100%'}" [inputStyle]="{'width':'100%'}" (onSelect)="onStudentSelect()">
              <ng-template let-student pTemplate="item">
                <div class="student-option">
                  <strong>{{ student.name }}</strong>
                  <span class="student-meta">{{ student.admissionNo }} | {{ student.className }}-{{ student.section }}</span>
                </div>
              </ng-template>
            </p-autoComplete>
          </div>

          <!-- Student Info Card -->
          <div class="student-info-card" *ngIf="selectedStudent?.id">
            <div class="student-avatar">
              <i class="pi pi-user"></i>
            </div>
            <div class="student-details">
              <h4>{{ selectedStudent?.name }}</h4>
              <div class="detail-row">
                <span><i class="pi pi-id-card"></i> {{ selectedStudent?.admissionNo }}</span>
                <span><i class="pi pi-building"></i> {{ selectedStudent?.className }}-{{ selectedStudent?.section }}</span>
                <span><i class="pi pi-user"></i> S/o {{ selectedStudent?.fatherName }}</span>
              </div>
            </div>
            <div class="fee-summary">
              <div class="fee-item">
                <span class="label">Total Fees</span>
                <span class="value">₹{{ selectedStudent?.totalFees | number }}</span>
              </div>
              <div class="fee-item">
                <span class="label">Paid</span>
                <span class="value success">₹{{ selectedStudent?.paidFees | number }}</span>
              </div>
              <div class="fee-item">
                <span class="label">Outstanding</span>
                <span class="value danger">₹{{ selectedStudent?.outstandingFees | number }}</span>
              </div>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Step 2: Adjustment Details -->
        <div class="form-section" [class.disabled-section]="!selectedStudent?.id">
          <h3><i class="pi pi-sliders-h"></i> Adjustment Details</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>Adjustment Type *</label>
              <p-dropdown [options]="adjustmentTypes" [(ngModel)]="adjustmentType" placeholder="Select Type"
                          optionLabel="label" optionValue="value" [style]="{'width':'100%'}" (onChange)="onTypeChange()"></p-dropdown>
            </div>
            <div class="form-field">
              <label>Concession Category</label>
              <p-dropdown [options]="concessionCategories" [(ngModel)]="concessionCategory" placeholder="Select Category (Optional)"
                          optionLabel="label" optionValue="value" [style]="{'width':'100%'}" [showClear]="true"
                          [disabled]="adjustmentType !== 'DISCOUNT' && adjustmentType !== 'WAIVER'"></p-dropdown>
            </div>
            <div class="form-field">
              <label>Amount Type</label>
              <p-dropdown [options]="amountTypes" [(ngModel)]="amountType" placeholder="Select"
                          optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ amountType === 'PERCENTAGE' ? 'Percentage' : 'Amount' }} *</label>
              <p-inputNumber [(ngModel)]="amount" [min]="0" [max]="amountType === 'PERCENTAGE' ? 100 : 9999999"
                             [prefix]="amountType === 'FIXED' ? '₹' : ''" [suffix]="amountType === 'PERCENTAGE' ? '%' : ''"
                             [style]="{'width':'100%'}"></p-inputNumber>
            </div>
          </div>

          <div class="form-field full-width">
            <label>Reason / Justification *</label>
            <textarea pInputTextarea [(ngModel)]="reason" [rows]="3" placeholder="Enter detailed reason for this adjustment..."
                      [style]="{'width':'100%'}"></textarea>
          </div>

          <div class="form-field full-width">
            <label>Supporting Documents</label>
            <div class="file-upload">
              <input type="file" id="documents" multiple accept=".pdf,.jpg,.png" />
              <label for="documents" class="upload-label">
                <i class="pi pi-upload"></i>
                <span>Click to upload documents (PDF, JPG, PNG)</span>
              </label>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Preview -->
        <div class="form-section preview-section" *ngIf="selectedStudent?.id && adjustmentType && amount">
          <h3><i class="pi pi-eye"></i> Adjustment Preview</h3>
          <div class="preview-card">
            <div class="preview-header">
              <p-tag [value]="adjustmentType" [severity]="getTypeSeverity(adjustmentType)"></p-tag>
              <span class="preview-amount" [class]="getAmountClass()">
                {{ isDeduction() ? '-' : '+' }}₹{{ getCalculatedAmount() | number }}
              </span>
            </div>
            <div class="preview-details">
              <p><strong>Student:</strong> {{ selectedStudent?.name }} ({{ selectedStudent?.admissionNo }})</p>
              <p><strong>Reason:</strong> {{ reason || 'Not specified' }}</p>
              <p *ngIf="concessionCategory"><strong>Category:</strong> {{ getConcessionLabel() }}</p>
            </div>
            <div class="preview-impact">
              <span>After adjustment:</span>
              <span class="new-balance">Outstanding: ₹{{ getNewOutstanding() | number }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button pButton label="Cancel" class="p-button-outlined" routerLink="../"></button>
          <button pButton label="Save as Draft" icon="pi pi-save" class="p-button-secondary" (click)="saveDraft()"
                  [disabled]="!isFormValid()"></button>
          <button pButton label="Submit for Approval" icon="pi pi-send" (click)="submitForApproval()"
                  [disabled]="!isFormValid()" [loading]="submitting"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .adjustment-form { padding: 1.5rem; max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }

    .form-container { background: var(--surface-card); border-radius: 12px; padding: 2rem; }
    .form-section { margin-bottom: 1rem; }
    .form-section h3 { margin: 0 0 1.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }
    .form-section h3 i { color: var(--primary-color); }
    .disabled-section { opacity: 0.5; pointer-events: none; }

    .search-field { margin-bottom: 1.5rem; }
    .search-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-color-secondary); }
    .student-option { display: flex; flex-direction: column; padding: 0.25rem 0; }
    .student-meta { font-size: 0.875rem; color: var(--text-color-secondary); }

    .student-info-card { display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem; background: var(--surface-ground); border-radius: 12px; border: 1px solid var(--surface-border); }
    .student-avatar { width: 60px; height: 60px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .student-details { flex: 1; }
    .student-details h4 { margin: 0 0 0.5rem; }
    .student-details .detail-row { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .student-details .detail-row span { display: flex; align-items: center; gap: 0.25rem; }
    .fee-summary { display: flex; gap: 1.5rem; padding-left: 1.5rem; border-left: 1px solid var(--surface-border); }
    .fee-item { display: flex; flex-direction: column; align-items: center; }
    .fee-item .label { font-size: 0.75rem; color: var(--text-color-secondary); }
    .fee-item .value { font-size: 1.1rem; font-weight: 600; }
    .fee-item .value.success { color: #10b981; }
    .fee-item .value.danger { color: #ef4444; }

    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field.full-width { grid-column: span 2; }
    .form-field label { font-weight: 500; color: var(--text-color-secondary); font-size: 0.875rem; }

    .file-upload { border: 2px dashed var(--surface-border); border-radius: 8px; padding: 1.5rem; text-align: center; }
    .file-upload input { display: none; }
    .upload-label { cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--text-color-secondary); }
    .upload-label i { font-size: 2rem; color: var(--primary-color); }

    .preview-section { margin-top: 1rem; }
    .preview-card { background: var(--surface-ground); border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--primary-color); }
    .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .preview-amount { font-size: 1.5rem; font-weight: 700; }
    .preview-amount.deduction { color: #10b981; }
    .preview-amount.addition { color: #ef4444; }
    .preview-details p { margin: 0.5rem 0; font-size: 0.875rem; }
    .preview-impact { display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
    .new-balance { font-weight: 600; color: var(--primary-color); }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--surface-border); }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-field.full-width { grid-column: span 1; }
      .student-info-card { flex-direction: column; text-align: center; }
      .fee-summary { border-left: none; padding-left: 0; border-top: 1px solid var(--surface-border); padding-top: 1rem; }
    }
  `]
})
export class AdjustmentFormComponent implements OnInit {
  selectedStudent: Student | null = null;
  filteredStudents: Student[] = [];
  adjustmentType = '';
  concessionCategory = '';
  amountType = 'FIXED';
  amount: number = 0;
  reason = '';
  submitting = false;

  students: Student[] = [];

  adjustmentTypes = [
    { label: 'Discount', value: 'DISCOUNT' },
    { label: 'Waiver', value: 'WAIVER' },
    { label: 'Penalty', value: 'PENALTY' },
    { label: 'Refund', value: 'REFUND' }
  ];

  concessionCategories = [
    { label: 'Staff Ward', value: 'STAFF_WARD' },
    { label: 'Sibling Discount', value: 'SIBLING' },
    { label: 'Merit Scholarship', value: 'MERIT' },
    { label: 'Sports Scholarship', value: 'SPORTS' },
    { label: 'Financial Aid', value: 'FINANCIAL_AID' },
    { label: 'Early Payment', value: 'EARLY_PAYMENT' },
    { label: 'Other', value: 'OTHER' }
  ];

  amountTypes = [
    { label: 'Fixed Amount', value: 'FIXED' },
    { label: 'Percentage', value: 'PERCENTAGE' }
  ];

  constructor(private router: Router, private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.students = [
      { id: '1', name: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10', section: 'A', fatherName: 'Rajesh Sharma', totalFees: 72000, paidFees: 36000, outstandingFees: 36000 },
      { id: '2', name: 'Priya Patel', admissionNo: 'ADM2024002', className: 'Class 8', section: 'B', fatherName: 'Suresh Patel', totalFees: 65000, paidFees: 65000, outstandingFees: 0 },
      { id: '3', name: 'Amit Kumar', admissionNo: 'ADM2024003', className: 'Class 12', section: 'A', fatherName: 'Vinod Kumar', totalFees: 85000, paidFees: 42500, outstandingFees: 42500 },
      { id: '4', name: 'Sneha Gupta', admissionNo: 'ADM2024004', className: 'Class 10', section: 'A', fatherName: 'Ramesh Gupta', totalFees: 72000, paidFees: 54000, outstandingFees: 18000 }
    ];
  }

  searchStudents(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredStudents = this.students.filter(s =>
      s.name.toLowerCase().includes(query) || s.admissionNo.toLowerCase().includes(query)
    );
  }

  onStudentSelect(): void {
    // Reset form when student changes
    this.adjustmentType = '';
    this.concessionCategory = '';
    this.amount = 0;
    this.reason = '';
  }

  onTypeChange(): void {
    if (this.adjustmentType !== 'DISCOUNT' && this.adjustmentType !== 'WAIVER') {
      this.concessionCategory = '';
    }
  }

  isDeduction(): boolean {
    return this.adjustmentType === 'DISCOUNT' || this.adjustmentType === 'WAIVER' || this.adjustmentType === 'REFUND';
  }

  getAmountClass(): string {
    return this.isDeduction() ? 'deduction' : 'addition';
  }

  getCalculatedAmount(): number {
    if (!this.selectedStudent || !this.amount) return 0;
    if (this.amountType === 'PERCENTAGE') {
      return Math.round((this.selectedStudent.totalFees * this.amount) / 100);
    }
    return this.amount;
  }

  getNewOutstanding(): number {
    if (!this.selectedStudent) return 0;
    const calculated = this.getCalculatedAmount();
    if (this.isDeduction()) {
      return Math.max(0, this.selectedStudent.outstandingFees - calculated);
    }
    return this.selectedStudent.outstandingFees + calculated;
  }

  getConcessionLabel(): string {
    const cat = this.concessionCategories.find(c => c.value === this.concessionCategory);
    return cat ? cat.label : '';
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = { 'DISCOUNT': 'info', 'WAIVER': 'success', 'PENALTY': 'danger', 'REFUND': 'warn' };
    return map[type] || 'info';
  }

  isFormValid(): boolean {
    return !!(this.selectedStudent?.id && this.adjustmentType && this.amount > 0 && this.reason.trim());
  }

  saveDraft(): void {
    this.messageService.add({ severity: 'info', summary: 'Draft Saved', detail: 'Adjustment saved as draft', life: 3000 });
  }

  submitForApproval(): void {
    this.submitting = true;
    setTimeout(() => {
      this.submitting = false;
      this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Adjustment submitted for approval', life: 3000 });
      setTimeout(() => this.router.navigate(['..'], { relativeTo: this.router.routerState.root }), 1500);
    }, 1500);
  }
}
