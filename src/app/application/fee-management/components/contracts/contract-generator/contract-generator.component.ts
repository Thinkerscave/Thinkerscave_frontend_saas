import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { AppToastComponent } from '../../../../../core/feedback/app-toast.component';
import { StepsModule } from 'primeng/steps';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

interface Student {
    id: string;
    name: string;
    admissionNo: string;
    className: string;
    section: string;
    selected: boolean;
    hasContract: boolean;
}

interface FeeStructure {
    id: string;
    name: string;
    classProgram: string;
    academicYear: string;
    totalAmount: number;
    installments: number;
}

@Component({
    selector: 'app-contract-generator',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AppToastComponent, 
        CommonModule, FormsModule, RouterModule, ButtonModule, DropdownModule,
        TableModule, TagModule, CheckboxModule, DividerModule,
        StepsModule, DialogModule, InputTextModule
    ],
    providers: [MessageService],
    template: `
    <div class="contract-generator">
      <app-toast></app-toast>
      <div class="page-header">
        <div>
          <h2><i class="pi pi-cog"></i> Generate Fee Contracts</h2>
          <p>Create fee contracts for students based on fee structure</p>
        </div>
        <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
      </div>

      <div class="steps-container">
        <p-steps [model]="steps" [activeIndex]="activeStep" [readonly]="true"></p-steps>
      </div>

      <!-- Step 1: Select Fee Structure -->
      <div class="step-content" *ngIf="activeStep === 0">
        <div class="form-section">
          <h3><i class="pi pi-sitemap"></i> Select Fee Structure</h3>
          <p class="section-desc">Choose the fee structure to apply for contract generation</p>

          <div class="filter-row">
            <div class="filter-field">
              <label>Academic Year</label>
              <p-dropdown [options]="academicYears" [(ngModel)]="selectedAcademicYear"
                          placeholder="Select Year" optionLabel="label" optionValue="value"
                          [style]="{'width':'100%'}"></p-dropdown>
            </div>
            <div class="filter-field">
              <label>Class/Program</label>
              <p-dropdown [options]="classes" [(ngModel)]="selectedClass"
                          placeholder="All Classes" optionLabel="label" optionValue="value"
                          [style]="{'width':'100%'}" [showClear]="true"></p-dropdown>
            </div>
          </div>

          <div class="structure-cards">
            <div class="structure-card" *ngFor="let structure of feeStructures"
                 [class.selected]="selectedStructure?.id === structure.id"
                 (click)="selectStructure(structure)">
              <div class="structure-header">
                <h4>{{ structure.name }}</h4>
                <p-tag [value]="structure.academicYear" severity="info"></p-tag>
              </div>
              <div class="structure-details">
                <div class="detail-item"><span class="label">Class:</span><span class="value">{{ structure.classProgram }}</span></div>
                <div class="detail-item"><span class="label">Amount:</span><span class="value amount">₹{{ structure.totalAmount | number }}</span></div>
                <div class="detail-item"><span class="label">Installments:</span><span class="value">{{ structure.installments }}</span></div>
              </div>
              <div class="select-indicator" *ngIf="selectedStructure?.id === structure.id"><i class="pi pi-check-circle"></i></div>
            </div>
          </div>
        </div>
        <div class="step-actions">
          <button pButton label="Next: Select Students" icon="pi pi-arrow-right" iconPos="right"
                  [disabled]="!selectedStructure" (click)="nextStep()"></button>
        </div>
      </div>

      <!-- Step 2: Select Students -->
      <div class="step-content" *ngIf="activeStep === 1">
        <div class="selected-banner">
          <i class="pi pi-sitemap"></i>
          <div class="banner-info">
            <span class="name">{{ selectedStructure?.name }}</span>
            <span class="details">{{ selectedStructure?.classProgram }} | ₹{{ selectedStructure?.totalAmount | number }}</span>
          </div>
          <button pButton label="Change" class="p-button-text p-button-sm" (click)="activeStep = 0"></button>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h3><i class="pi pi-users"></i> Select Students</h3>
            <div class="selection-info">
              <span class="count">{{ getSelectedStudents().length }}</span> of {{ students.length }} selected
            </div>
          </div>

          <div class="table-toolbar">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input type="text" pInputText [(ngModel)]="studentSearch" placeholder="Search..." (input)="filterStudents()" />
            </span>
            <div class="bulk-actions">
              <button pButton label="Select All" icon="pi pi-check-square" class="p-button-outlined p-button-sm" (click)="selectAllStudents()"></button>
              <button pButton label="Clear" icon="pi pi-times" class="p-button-outlined p-button-secondary p-button-sm" (click)="clearAllStudents()"></button>
            </div>
          </div>

          <p-table [value]="filteredStudents" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th style="width:50px"><p-checkbox [(ngModel)]="selectAll" [binary]="true" (onChange)="toggleSelectAll()"></p-checkbox></th>
                <th>Admission No</th><th>Name</th><th>Class</th><th>Section</th><th>Status</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-student>
              <tr [class.disabled-row]="student.hasContract">
                <td><p-checkbox [(ngModel)]="student.selected" [binary]="true" [disabled]="student.hasContract"></p-checkbox></td>
                <td><code>{{ student.admissionNo }}</code></td>
                <td><strong>{{ student.name }}</strong></td>
                <td>{{ student.className }}</td>
                <td>{{ student.section }}</td>
                <td><p-tag [value]="student.hasContract ? 'Has Contract' : 'No Contract'" [severity]="student.hasContract ? 'info' : 'warn'"></p-tag></td>
              </tr>
            </ng-template>
          </p-table>
        </div>
        <div class="step-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-secondary" (click)="prevStep()"></button>
          <button pButton label="Review & Generate" icon="pi pi-arrow-right" iconPos="right"
                  [disabled]="getSelectedStudents().length === 0" (click)="nextStep()"></button>
        </div>
      </div>

      <!-- Step 3: Review -->
      <div class="step-content" *ngIf="activeStep === 2">
        <div class="form-section">
          <h3><i class="pi pi-check-circle"></i> Review & Generate</h3>
          <div class="review-grid">
            <div class="review-card"><i class="pi pi-sitemap"></i><div><span>Structure</span><strong>{{ selectedStructure?.name }}</strong></div></div>
            <div class="review-card"><i class="pi pi-users"></i><div><span>Students</span><strong>{{ getSelectedStudents().length }}</strong></div></div>
            <div class="review-card"><i class="pi pi-calendar"></i><div><span>Year</span><strong>{{ selectedStructure?.academicYear }}</strong></div></div>
            <div class="review-card highlight"><i class="pi pi-indian-rupee"></i><div><span>Total Value</span><strong>₹{{ (selectedStructure?.totalAmount || 0) * getSelectedStudents().length | number }}</strong></div></div>
          </div>
          <p-divider></p-divider>
          <h4>Selected Students</h4>
          <p-table [value]="getSelectedStudents()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header"><tr><th>Admission No</th><th>Name</th><th>Class</th><th>Amount</th></tr></ng-template>
            <ng-template pTemplate="body" let-s>
              <tr><td><code>{{ s.admissionNo }}</code></td><td>{{ s.name }}</td><td>{{ s.className }}-{{ s.section }}</td><td class="amount">₹{{ selectedStructure?.totalAmount | number }}</td></tr>
            </ng-template>
          </p-table>
        </div>
        <div class="step-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-secondary" (click)="prevStep()"></button>
          <button pButton label="Generate Contracts" icon="pi pi-check" class="p-button-success" [loading]="generating" (click)="generateContracts()"></button>
        </div>
      </div>

      <p-dialog [(visible)]="showSuccessDialog" header="Success" [modal]="true" [closable]="false" [style]="{width:'400px'}">
        <div class="success-content">
          <div class="success-icon"><i class="pi pi-check-circle"></i></div>
          <h3>Contracts Generated!</h3>
          <p>{{ generationResult.created }} contracts created with total value of ₹{{ generationResult.totalValue | number }}</p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="View Contracts" icon="pi pi-list" routerLink="../"></button>
          <button pButton label="Generate More" icon="pi pi-plus" class="p-button-outlined" (click)="resetGenerator()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
    styles: [`
    .contract-generator { padding: 1.5rem; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .steps-container { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .step-content { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .form-section h3 { margin: 0 0 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .form-section h3 i { color: var(--primary-color); }
    .section-desc { color: var(--text-color-secondary); margin: 0 0 1.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .filter-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; }
    .filter-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-field label { font-weight: 500; color: var(--text-color-secondary); font-size: 0.875rem; }
    .structure-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .structure-card { background: var(--surface-ground); border-radius: 12px; padding: 1.25rem; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; position: relative; }
    .structure-card:hover, .structure-card.selected { border-color: var(--primary-color); }
    .structure-card.selected { background: rgba(99, 102, 241, 0.05); }
    .structure-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .structure-header h4 { margin: 0; }
    .structure-details { display: flex; flex-direction: column; gap: 0.5rem; }
    .detail-item { display: flex; justify-content: space-between; }
    .detail-item .label { color: var(--text-color-secondary); font-size: 0.875rem; }
    .detail-item .value { font-weight: 500; }
    .detail-item .value.amount { color: #10b981; }
    .select-indicator { position: absolute; top: 1rem; right: 1rem; color: var(--primary-color); font-size: 1.5rem; }
    .selected-banner { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--primary-color); color: white; border-radius: 8px; margin-bottom: 1.5rem; }
    .selected-banner i { font-size: 1.5rem; }
    .banner-info { flex: 1; display: flex; flex-direction: column; }
    .banner-info .name { font-weight: 600; }
    .banner-info .details { font-size: 0.875rem; opacity: 0.9; }
    .selection-info { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--surface-ground); border-radius: 8px; }
    .selection-info .count { font-size: 1.25rem; font-weight: 700; color: var(--primary-color); }
    .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .bulk-actions { display: flex; gap: 0.5rem; }
    .disabled-row { opacity: 0.5; }
    code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; }
    .review-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .review-card { background: var(--surface-ground); border-radius: 12px; padding: 1.25rem; display: flex; gap: 1rem; align-items: center; }
    .review-card i { font-size: 1.5rem; color: var(--primary-color); }
    .review-card.highlight { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .review-card.highlight i { color: white; }
    .review-card div { display: flex; flex-direction: column; }
    .review-card span { font-size: 0.75rem; opacity: 0.7; }
    .review-card strong { font-size: 1.1rem; }
    .amount { color: #10b981; font-weight: 600; }
    .step-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--surface-border); }
    .success-content { text-align: center; padding: 1rem; }
    .success-icon { width: 80px; height: 80px; border-radius: 50%; background: #d1fae5; color: #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .success-icon i { font-size: 3rem; }
    .success-content h3 { margin: 0 0 0.5rem; color: #10b981; }
    @media (max-width: 768px) { .filter-row, .review-grid { grid-template-columns: 1fr; } .table-toolbar { flex-direction: column; gap: 1rem; } }
  `]
})
export class ContractGeneratorComponent implements OnInit {
    activeStep = 0;
    generating = false;
    showSuccessDialog = false;
    studentSearch = '';
    selectAll = false;
    selectedAcademicYear = '2025-26';
    selectedClass = '';
    selectedStructure: FeeStructure | null = null;

    steps = [{ label: 'Select Structure' }, { label: 'Select Students' }, { label: 'Review & Generate' }];
    academicYears = [{ label: '2024-25', value: '2024-25' }, { label: '2025-26', value: '2025-26' }, { label: '2026-27', value: '2026-27' }];
    classes = [{ label: 'Class 5', value: 'CLASS_5' }, { label: 'Class 10', value: 'CLASS_10' }, { label: 'Class 12', value: 'CLASS_12' }];

    feeStructures: FeeStructure[] = [];
    students: Student[] = [];
    filteredStudents: Student[] = [];
    generationResult = { created: 0, totalValue: 0 };

    constructor(private messageService: MessageService) { }

    ngOnInit(): void {
        this.feeStructures = [
            { id: '1', name: 'Class 10 Regular 2025-26', classProgram: 'Class 10', academicYear: '2025-26', totalAmount: 72000, installments: 4 },
            { id: '2', name: 'Class 12 Science 2025-26', classProgram: 'Class 12', academicYear: '2025-26', totalAmount: 85000, installments: 4 },
            { id: '3', name: 'Class 5 Regular 2025-26', classProgram: 'Class 5', academicYear: '2025-26', totalAmount: 48000, installments: 3 }
        ];
    }

    selectStructure(s: FeeStructure): void {
        this.selectedStructure = s;
        this.students = [
            { id: '1', name: 'Rahul Sharma', admissionNo: 'ADM2024001', className: 'Class 10', section: 'A', selected: false, hasContract: false },
            { id: '2', name: 'Priya Patel', admissionNo: 'ADM2024002', className: 'Class 10', section: 'A', selected: false, hasContract: true },
            { id: '3', name: 'Amit Kumar', admissionNo: 'ADM2024003', className: 'Class 10', section: 'B', selected: false, hasContract: false },
            { id: '4', name: 'Sneha Gupta', admissionNo: 'ADM2024004', className: 'Class 10', section: 'A', selected: false, hasContract: false },
            { id: '5', name: 'Vikram Singh', admissionNo: 'ADM2024005', className: 'Class 10', section: 'B', selected: false, hasContract: true },
            { id: '6', name: 'Anjali Verma', admissionNo: 'ADM2024006', className: 'Class 10', section: 'A', selected: false, hasContract: false }
        ];
        this.filteredStudents = [...this.students];
    }

    filterStudents(): void {
        this.filteredStudents = this.studentSearch.trim()
            ? this.students.filter(s => s.name.toLowerCase().includes(this.studentSearch.toLowerCase()) || s.admissionNo.toLowerCase().includes(this.studentSearch.toLowerCase()))
            : [...this.students];
    }

    selectAllStudents(): void { this.students.forEach(s => { if (!s.hasContract) s.selected = true; }); }
    clearAllStudents(): void { this.students.forEach(s => s.selected = false); }
    toggleSelectAll(): void { this.selectAll ? this.selectAllStudents() : this.clearAllStudents(); }
    getSelectedStudents(): Student[] { return this.students.filter(s => s.selected); }
    nextStep(): void { if (this.activeStep < 2) this.activeStep++; }
    prevStep(): void { if (this.activeStep > 0) this.activeStep--; }

    generateContracts(): void {
        this.generating = true;
        setTimeout(() => {
            const selected = this.getSelectedStudents();
            this.generationResult = { created: selected.length, totalValue: (this.selectedStructure?.totalAmount || 0) * selected.length };
            this.generating = false;
            this.showSuccessDialog = true;
            this.messageService.add({ severity: 'success', summary: 'Success', detail: `${selected.length} contracts generated`, life: 3000 });
        }, 1500);
    }

    resetGenerator(): void {
        this.showSuccessDialog = false;
        this.activeStep = 0;
        this.selectedStructure = null;
        this.students = [];
        this.filteredStudents = [];
    }
}
