import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { StepsModule } from 'primeng/steps';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

interface Student {
    id: string;
    name: string;
    admissionNo: string;
    className: string;
    section: string;
    fatherName: string;
    phone: string;
}

interface Contract {
    id: string;
    contractNumber: string;
    studentId: string;
    studentName: string;
    className: string;
    academicYear: string;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    status: string;
    installments: Installment[];
}

interface Installment {
    id: string;
    name: string;
    amount: number;
    dueDate: Date;
    paidAmount: number;
    status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
}

@Component({
    selector: 'app-payment-collection',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DropdownModule,
        CalendarModule,
        TableModule,
        TagModule,
        DividerModule,
        ToastModule,
        DialogModule,
        StepsModule,
        RadioButtonModule,
        TextareaModule
    ],
    providers: [MessageService],
    template: `
    <div class="payment-collection">
      <p-toast></p-toast>

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2><i class="pi pi-credit-card"></i> Collect Payment</h2>
          <p>Record fee payments from students</p>
        </div>
        <div class="header-actions">
          <button pButton label="Payment History" icon="pi pi-history" class="p-button-outlined" routerLink="history"></button>
        </div>
      </div>

      <!-- Step Indicator -->
      <div class="steps-container">
        <p-steps [model]="steps" [activeIndex]="activeStep" [readonly]="true"></p-steps>
      </div>

      <!-- Step 1: Search Student -->
      <div class="step-content" *ngIf="activeStep === 0">
        <div class="search-section">
          <h3><i class="pi pi-search"></i> Search Student</h3>
          <p class="section-desc">Enter admission number, name, or phone to find student</p>

          <div class="search-box">
            <span class="p-input-icon-left search-input-wrapper">
              <i class="pi pi-search"></i>
              <input type="text" pInputText [(ngModel)]="searchQuery"
                     placeholder="Search by admission no, name, or phone..."
                     (keyup.enter)="searchStudents()" class="search-input" />
            </span>
            <button pButton label="Search" icon="pi pi-search" (click)="searchStudents()"></button>
          </div>

          <!-- Search Results -->
          <div class="search-results" *ngIf="searchResults.length > 0">
            <h4>Search Results ({{ searchResults.length }})</h4>
            <div class="student-cards">
              <div class="student-card" *ngFor="let student of searchResults"
                   [class.selected]="selectedStudent?.id === student.id"
                   (click)="selectStudent(student)">
                <div class="student-avatar">
                  <i class="pi pi-user"></i>
                </div>
                <div class="student-info">
                  <span class="student-name">{{ student.name }}</span>
                  <span class="student-details">{{ student.admissionNo }} | {{ student.className }}-{{ student.section }}</span>
                  <span class="student-parent">S/o {{ student.fatherName }}</span>
                </div>
                <div class="student-action">
                  <i class="pi pi-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div class="no-results" *ngIf="searched && searchResults.length === 0">
            <i class="pi pi-info-circle"></i>
            <p>No students found matching your search criteria</p>
          </div>
        </div>

        <div class="step-actions">
          <button pButton label="Next" icon="pi pi-arrow-right" iconPos="right"
                  [disabled]="!selectedStudent" (click)="nextStep()"></button>
        </div>
      </div>

      <!-- Step 2: Select Contract & Installment -->
      <div class="step-content" *ngIf="activeStep === 1">
        <div class="selected-student-banner" *ngIf="selectedStudent">
          <div class="student-avatar"><i class="pi pi-user"></i></div>
          <div class="student-info">
            <span class="name">{{ selectedStudent.name }}</span>
            <span class="details">{{ selectedStudent.admissionNo }} | {{ selectedStudent.className }}-{{ selectedStudent.section }}</span>
          </div>
          <button pButton label="Change" class="p-button-text p-button-sm" (click)="activeStep = 0"></button>
        </div>

        <div class="contracts-section">
          <h3><i class="pi pi-file"></i> Active Fee Contracts</h3>

          <div class="contract-cards">
            <div class="contract-card" *ngFor="let contract of studentContracts"
                 [class.selected]="selectedContract?.id === contract.id"
                 (click)="selectContract(contract)">
              <div class="contract-header">
                <span class="contract-number">{{ contract.contractNumber }}</span>
                <p-tag [value]="contract.status" [severity]="getContractStatusSeverity(contract.status)"></p-tag>
              </div>
              <div class="contract-details">
                <div class="detail-row">
                  <span class="label">Academic Year:</span>
                  <span class="value">{{ contract.academicYear }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total Amount:</span>
                  <span class="value">₹{{ contract.totalAmount | number }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Paid:</span>
                  <span class="value paid">₹{{ contract.paidAmount | number }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Outstanding:</span>
                  <span class="value outstanding">₹{{ contract.outstandingAmount | number }}</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="(contract.paidAmount / contract.totalAmount) * 100"></div>
              </div>
            </div>
          </div>

          <!-- Installments Table -->
          <div class="installments-section" *ngIf="selectedContract">
            <h4>Installment Schedule</h4>
            <p-table [value]="selectedContract.installments" styleClass="p-datatable-sm p-datatable-striped">
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 50px">
                    <input type="checkbox" (change)="toggleAllInstallments($event)" />
                  </th>
                  <th>Installment</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-inst>
                <tr [class.selected-row]="isInstallmentSelected(inst)">
                  <td>
                    <input type="checkbox" [checked]="isInstallmentSelected(inst)"
                           [disabled]="inst.status === 'PAID'"
                           (change)="toggleInstallmentSelection(inst)" />
                  </td>
                  <td><strong>{{ inst.name }}</strong></td>
                  <td>{{ inst.dueDate | date:'dd/MM/yyyy' }}</td>
                  <td>₹{{ inst.amount | number }}</td>
                  <td class="text-success">₹{{ inst.paidAmount | number }}</td>
                  <td class="text-danger">₹{{ inst.amount - inst.paidAmount | number }}</td>
                  <td>
                    <p-tag [value]="inst.status" [severity]="getInstallmentStatusSeverity(inst.status)"></p-tag>
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <div class="selection-summary" *ngIf="selectedInstallments.length > 0">
              <div class="summary-item">
                <span>Selected Installments:</span>
                <strong>{{ selectedInstallments.length }}</strong>
              </div>
              <div class="summary-item">
                <span>Total Payable:</span>
                <strong class="amount">₹{{ getTotalPayable() | number }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-secondary" (click)="prevStep()"></button>
          <button pButton label="Proceed to Payment" icon="pi pi-arrow-right" iconPos="right"
                  [disabled]="selectedInstallments.length === 0" (click)="nextStep()"></button>
        </div>
      </div>

      <!-- Step 3: Payment Details -->
      <div class="step-content" *ngIf="activeStep === 2">
        <div class="payment-form-container">
          <div class="payment-summary-card">
            <h3><i class="pi pi-receipt"></i> Payment Summary</h3>
            <div class="summary-details">
              <div class="summary-row">
                <span>Student:</span>
                <strong>{{ selectedStudent?.name }}</strong>
              </div>
              <div class="summary-row">
                <span>Contract:</span>
                <strong>{{ selectedContract?.contractNumber }}</strong>
              </div>
              <div class="summary-row">
                <span>Selected Installments:</span>
                <strong>{{ selectedInstallments.length }}</strong>
              </div>
              <p-divider></p-divider>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <strong>₹{{ getTotalPayable() | number }}</strong>
              </div>
            </div>
          </div>

          <div class="payment-form-card">
            <h3><i class="pi pi-credit-card"></i> Payment Details</h3>
            <form [formGroup]="paymentForm">
              <div class="form-grid">
                <div class="form-field">
                  <label>Payment Amount (₹) <span class="required">*</span></label>
                  <p-inputNumber formControlName="amount" mode="currency" currency="INR" locale="en-IN"
                                 [style]="{'width':'100%'}"></p-inputNumber>
                  <small class="hint">Total payable: ₹{{ getTotalPayable() | number }}</small>
                </div>

                <div class="form-field">
                  <label>Payment Date <span class="required">*</span></label>
                  <p-calendar formControlName="paymentDate" [showIcon]="true" dateFormat="dd/mm/yy"
                              [style]="{'width':'100%'}" [maxDate]="today"></p-calendar>
                </div>

                <div class="form-field full-width">
                  <label>Payment Mode <span class="required">*</span></label>
                  <div class="payment-modes">
                    <div class="payment-mode" *ngFor="let mode of paymentModes"
                         [class.selected]="paymentForm.get('paymentMode')?.value === mode.value"
                         (click)="selectPaymentMode(mode.value)">
                      <i [class]="mode.icon"></i>
                      <span>{{ mode.label }}</span>
                    </div>
                  </div>
                </div>

                <!-- Conditional fields based on payment mode -->
                <ng-container *ngIf="paymentForm.get('paymentMode')?.value === 'CHEQUE'">
                  <div class="form-field">
                    <label>Cheque Number <span class="required">*</span></label>
                    <input type="text" pInputText formControlName="chequeNumber" placeholder="Enter cheque number" />
                  </div>
                  <div class="form-field">
                    <label>Bank Name <span class="required">*</span></label>
                    <input type="text" pInputText formControlName="bankName" placeholder="Enter bank name" />
                  </div>
                  <div class="form-field">
                    <label>Cheque Date</label>
                    <p-calendar formControlName="chequeDate" [showIcon]="true" dateFormat="dd/mm/yy"
                                [style]="{'width':'100%'}"></p-calendar>
                  </div>
                </ng-container>

                <ng-container *ngIf="paymentForm.get('paymentMode')?.value === 'BANK_TRANSFER'">
                  <div class="form-field">
                    <label>Transaction Reference <span class="required">*</span></label>
                    <input type="text" pInputText formControlName="transactionRef" placeholder="Enter transaction ID" />
                  </div>
                  <div class="form-field">
                    <label>Bank Name</label>
                    <input type="text" pInputText formControlName="bankName" placeholder="Enter bank name" />
                  </div>
                </ng-container>

                <ng-container *ngIf="paymentForm.get('paymentMode')?.value === 'UPI'">
                  <div class="form-field">
                    <label>UPI Transaction ID <span class="required">*</span></label>
                    <input type="text" pInputText formControlName="transactionRef" placeholder="Enter UPI transaction ID" />
                  </div>
                </ng-container>

                <ng-container *ngIf="paymentForm.get('paymentMode')?.value === 'CARD'">
                  <div class="form-field">
                    <label>Card Last 4 Digits</label>
                    <input type="text" pInputText formControlName="cardLast4" placeholder="XXXX" maxlength="4" />
                  </div>
                  <div class="form-field">
                    <label>Authorization Code</label>
                    <input type="text" pInputText formControlName="transactionRef" placeholder="Enter auth code" />
                  </div>
                </ng-container>

                <div class="form-field full-width">
                  <label>Remarks</label>
                  <textarea pTextarea formControlName="remarks" rows="2"
                            placeholder="Any additional notes..." class="w-full"></textarea>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div class="step-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-secondary" (click)="prevStep()"></button>
          <button pButton label="Process Payment" icon="pi pi-check" class="p-button-success"
                  [disabled]="paymentForm.invalid" (click)="processPayment()"></button>
        </div>
      </div>

      <!-- Success Dialog -->
      <p-dialog [(visible)]="showSuccessDialog" header="Payment Successful" [modal]="true"
                [closable]="false" [style]="{width: '450px'}">
        <div class="success-content">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h3>Payment Recorded Successfully!</h3>
          <div class="receipt-info">
            <div class="info-row">
              <span>Receipt Number:</span>
              <strong>{{ generatedReceipt?.receiptNumber }}</strong>
            </div>
            <div class="info-row">
              <span>Amount Paid:</span>
              <strong>₹{{ generatedReceipt?.amount | number }}</strong>
            </div>
            <div class="info-row">
              <span>Payment Mode:</span>
              <strong>{{ generatedReceipt?.paymentMode }}</strong>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Print Receipt" icon="pi pi-print" class="p-button-outlined" (click)="printReceipt()"></button>
          <button pButton label="New Payment" icon="pi pi-plus" (click)="startNewPayment()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
    styles: [`
    .payment-collection {
      padding: 1.5rem;
      max-width: 1200px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .page-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-color);
    }

    .page-header p {
      margin: 0.25rem 0 0;
      color: var(--text-color-secondary);
    }

    .steps-container {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .step-content {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .search-section h3, .contracts-section h3, .payment-form-card h3, .payment-summary-card h3 {
      margin: 0 0 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-color);
    }

    .section-desc {
      color: var(--text-color-secondary);
      margin: 0 0 1.5rem;
    }

    .search-box {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .search-input-wrapper {
      flex: 1;
    }

    .search-input {
      width: 100%;
      padding-left: 2.5rem;
    }

    .student-cards {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .student-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-ground);
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .student-card:hover {
      border-color: var(--primary-color);
    }

    .student-card.selected {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: white;
    }

    .student-card.selected .student-details,
    .student-card.selected .student-parent {
      color: rgba(255,255,255,0.8);
    }

    .student-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .student-card.selected .student-avatar {
      background: rgba(255,255,255,0.2);
    }

    .student-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .student-name {
      font-weight: 600;
    }

    .student-details, .student-parent {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: var(--text-color-secondary);
    }

    .no-results i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .selected-student-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--primary-color);
      color: white;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .selected-student-banner .student-avatar {
      background: rgba(255,255,255,0.2);
    }

    .selected-student-banner .name {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .selected-student-banner .details {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .contract-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .contract-card {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .contract-card:hover, .contract-card.selected {
      border-color: var(--primary-color);
    }

    .contract-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .contract-number {
      font-weight: 600;
      font-family: monospace;
    }

    .contract-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
    }

    .detail-row .label {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }

    .detail-row .value {
      font-weight: 500;
    }

    .detail-row .value.paid { color: #10b981; }
    .detail-row .value.outstanding { color: #ef4444; }

    .progress-bar {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      margin-top: 1rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 2px;
      transition: width 0.3s;
    }

    .installments-section {
      margin-top: 1.5rem;
    }

    .installments-section h4 {
      margin: 0 0 1rem;
      color: var(--text-color);
    }

    .selected-row {
      background: rgba(99, 102, 241, 0.1) !important;
    }

    .text-success { color: #10b981; font-weight: 500; }
    .text-danger { color: #ef4444; font-weight: 500; }

    .selection-summary {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      padding: 1rem;
      background: var(--surface-ground);
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .summary-item .amount {
      color: #10b981;
      font-size: 1.25rem;
    }

    .payment-form-container {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 1.5rem;
    }

    .payment-summary-card, .payment-form-card {
      background: var(--surface-ground);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .payment-summary-card h3 i, .payment-form-card h3 i {
      color: var(--primary-color);
    }

    .summary-details {
      margin-top: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .summary-row.total {
      font-size: 1.25rem;
    }

    .summary-row.total strong {
      color: #10b981;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-weight: 500;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }

    .required { color: #ef4444; }
    .hint { color: var(--text-color-secondary); font-size: 0.75rem; }

    .payment-modes {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.75rem;
    }

    .payment-mode {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--surface-card);
      border: 2px solid var(--surface-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .payment-mode:hover {
      border-color: var(--primary-color);
    }

    .payment-mode.selected {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: white;
    }

    .payment-mode i {
      font-size: 1.5rem;
    }

    .payment-mode span {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .w-full { width: 100%; }

    .success-content {
      text-align: center;
      padding: 1rem;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #d1fae5;
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .success-icon i {
      font-size: 3rem;
    }

    .success-content h3 {
      margin: 0 0 1.5rem;
      color: #10b981;
    }

    .receipt-info {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    @media (max-width: 768px) {
      .payment-form-container {
        grid-template-columns: 1fr;
      }

      .payment-modes {
        grid-template-columns: repeat(3, 1fr);
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .search-box {
        flex-direction: column;
      }
    }
  `]
})
export class PaymentCollectionComponent implements OnInit {
    today = new Date();
    activeStep = 0;
    searchQuery = '';
    searched = false;
    searchResults: Student[] = [];
    selectedStudent: Student | null = null;
    studentContracts: Contract[] = [];
    selectedContract: Contract | null = null;
    selectedInstallments: Installment[] = [];
    paymentForm!: FormGroup;
    showSuccessDialog = false;
    generatedReceipt: any = null;

    steps = [
        { label: 'Search Student' },
        { label: 'Select Contract' },
        { label: 'Payment Details' }
    ];

    paymentModes = [
        { label: 'Cash', value: 'CASH', icon: 'pi pi-wallet' },
        { label: 'UPI', value: 'UPI', icon: 'pi pi-mobile' },
        { label: 'Card', value: 'CARD', icon: 'pi pi-credit-card' },
        { label: 'Cheque', value: 'CHEQUE', icon: 'pi pi-file' },
        { label: 'Bank', value: 'BANK_TRANSFER', icon: 'pi pi-building' }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.initPaymentForm();
    }

    initPaymentForm(): void {
        this.paymentForm = this.fb.group({
            amount: [0, [Validators.required, Validators.min(1)]],
            paymentDate: [new Date(), Validators.required],
            paymentMode: ['CASH', Validators.required],
            chequeNumber: [''],
            chequeDate: [null],
            bankName: [''],
            transactionRef: [''],
            cardLast4: [''],
            remarks: ['']
        });
    }

    searchStudents(): void {
        this.searched = true;
        // Mock search results
        if (this.searchQuery.trim()) {
            this.searchResults = [
                { id: '1', name: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10', section: 'A', fatherName: 'Rajesh Sharma', phone: '9876543210' },
                { id: '2', name: 'Priya Patel', admissionNo: 'ADM2024002', className: 'Class 8', section: 'B', fatherName: 'Suresh Patel', phone: '9876543211' },
                { id: '3', name: 'Amit Kumar', admissionNo: 'ADM2024003', className: 'Class 12', section: 'A', fatherName: 'Ramesh Kumar', phone: '9876543212' }
            ].filter(s =>
                s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                s.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                s.phone.includes(this.searchQuery)
            );
        } else {
            this.searchResults = [];
        }
    }

    selectStudent(student: Student): void {
        this.selectedStudent = student;
        this.loadStudentContracts(student.id);
    }

    loadStudentContracts(studentId: string): void {
        // Mock contracts data
        this.studentContracts = [
            {
                id: '1',
                contractNumber: 'FC-2026-0001',
                studentId: studentId,
                studentName: this.selectedStudent?.name || '',
                className: this.selectedStudent?.className || '',
                academicYear: '2025-26',
                totalAmount: 72000,
                paidAmount: 36000,
                outstandingAmount: 36000,
                status: 'ACTIVE',
                installments: [
                    { id: '1', name: 'Q1 - Apr to Jun', amount: 18000, dueDate: new Date('2025-04-15'), paidAmount: 18000, status: 'PAID' },
                    { id: '2', name: 'Q2 - Jul to Sep', amount: 18000, dueDate: new Date('2025-07-15'), paidAmount: 18000, status: 'PAID' },
                    { id: '3', name: 'Q3 - Oct to Dec', amount: 18000, dueDate: new Date('2025-10-15'), paidAmount: 0, status: 'UNPAID' },
                    { id: '4', name: 'Q4 - Jan to Mar', amount: 18000, dueDate: new Date('2026-01-15'), paidAmount: 0, status: 'UNPAID' }
                ]
            }
        ];
    }

    selectContract(contract: Contract): void {
        this.selectedContract = contract;
        this.selectedInstallments = [];
    }

    isInstallmentSelected(inst: Installment): boolean {
        return this.selectedInstallments.some(i => i.id === inst.id);
    }

    toggleInstallmentSelection(inst: Installment): void {
        const index = this.selectedInstallments.findIndex(i => i.id === inst.id);
        if (index > -1) {
            this.selectedInstallments.splice(index, 1);
        } else {
            this.selectedInstallments.push(inst);
        }
        this.updatePaymentAmount();
    }

    toggleAllInstallments(event: any): void {
        if (event.target.checked) {
            this.selectedInstallments = this.selectedContract?.installments.filter(i => i.status !== 'PAID') || [];
        } else {
            this.selectedInstallments = [];
        }
        this.updatePaymentAmount();
    }

    updatePaymentAmount(): void {
        const total = this.getTotalPayable();
        this.paymentForm.patchValue({ amount: total });
    }

    getTotalPayable(): number {
        return this.selectedInstallments.reduce((sum, inst) => sum + (inst.amount - inst.paidAmount), 0);
    }

    selectPaymentMode(mode: string): void {
        this.paymentForm.patchValue({ paymentMode: mode });
    }

    getContractStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            'ACTIVE': 'success',
            'COMPLETED': 'info',
            'SUSPENDED': 'warn',
            'CANCELLED': 'danger'
        };
        return map[status] || 'info';
    }

    getInstallmentStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            'PAID': 'success',
            'PARTIAL': 'warn',
            'UNPAID': 'info',
            'OVERDUE': 'danger'
        };
        return map[status] || 'info';
    }

    nextStep(): void {
        if (this.activeStep < 2) {
            this.activeStep++;
        }
    }

    prevStep(): void {
        if (this.activeStep > 0) {
            this.activeStep--;
        }
    }

    processPayment(): void {
        if (this.paymentForm.valid) {
            // Generate mock receipt
            this.generatedReceipt = {
                receiptNumber: 'RCP-2026-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
                amount: this.paymentForm.value.amount,
                paymentMode: this.paymentForm.value.paymentMode,
                date: this.paymentForm.value.paymentDate
            };

            this.showSuccessDialog = true;
        }
    }

    printReceipt(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Print',
            detail: 'Opening print dialog...',
            life: 2000
        });
    }

    startNewPayment(): void {
        this.showSuccessDialog = false;
        this.activeStep = 0;
        this.searchQuery = '';
        this.searched = false;
        this.searchResults = [];
        this.selectedStudent = null;
        this.studentContracts = [];
        this.selectedContract = null;
        this.selectedInstallments = [];
        this.initPaymentForm();
    }
}
