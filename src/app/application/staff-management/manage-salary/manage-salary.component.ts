import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
interface SalaryDetails {
  basic: number;
  hra: number;
  specialAllowance: number;
  professionalTax: number;
  incomeTax: number;
  providentFund: number;
}

interface StaffSalary {
  id: string;
  name: string;
  department: string;
  ctc: number;
  salaryDetails: SalaryDetails;
}
@Component({
  selector: 'app-manage-salary',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    InputNumberModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manage-salary.component.html',
  styleUrl: './manage-salary.component.scss'
})
export class ManageSalaryComponent {
  staffSalaries: StaffSalary[] = [];
  salaryDialogVisible = false;
  salaryForm!: FormGroup;

  private selectedStaffId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // --- Mock Data ---
    this.staffSalaries = [
      { id: 'S-001', name: 'Priya Sharma', department: 'Technology', ctc: 1200000, salaryDetails: { basic: 50000, hra: 25000, specialAllowance: 15000, professionalTax: 200, incomeTax: 5000, providentFund: 6000 } },
      { id: 'S-002', name: 'Rohan Gupta', department: 'Sales', ctc: 950000, salaryDetails: { basic: 40000, hra: 20000, specialAllowance: 10000, professionalTax: 200, incomeTax: 3500, providentFund: 4800 } },
      { id: 'S-003', name: 'Anjali Verma', department: 'Human Resources', ctc: 700000, salaryDetails: { basic: 30000, hra: 15000, specialAllowance: 8000, professionalTax: 200, incomeTax: 2000, providentFund: 3600 } }
    ];

    // --- Initialize Salary Form ---
    this.salaryForm = this.fb.group({
      // Earnings
      basic: [0, Validators.required],
      hra: [0, Validators.required],
      specialAllowance: [0, Validators.required],
      // Deductions
      professionalTax: [0, Validators.required],
      incomeTax: [0, Validators.required],
      providentFund: [0, Validators.required],
    });
  }

  // --- Calculated Getters for Real-time Summary ---
  get grossSalary(): number {
    const { basic, hra, specialAllowance } = this.salaryForm.value;
    return (basic || 0) + (hra || 0) + (specialAllowance || 0);
  }

  get totalDeductions(): number {
    const { professionalTax, incomeTax, providentFund } = this.salaryForm.value;
    return (professionalTax || 0) + (incomeTax || 0) + (providentFund || 0);
  }

  get netSalary(): number {
    return this.grossSalary - this.totalDeductions;
  }

  // --- Component Methods ---
  editSalary(staff: StaffSalary): void {
    this.selectedStaffId = staff.id;
    this.salaryForm.patchValue(staff.salaryDetails);
    this.salaryDialogVisible = true;
  }

  hideDialog(): void {
    this.salaryDialogVisible = false;
    this.selectedStaffId = null;
  }

  saveSalary(): void {
    if (this.salaryForm.invalid || !this.selectedStaffId) {
      return;
    }
    // In a real app, you would send this to a service.
    // Here, we update the local mock data.
    const index = this.staffSalaries.findIndex(s => s.id === this.selectedStaffId);
    if (index !== -1) {
      this.staffSalaries[index].salaryDetails = this.salaryForm.value;
    }

    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Salary details updated successfully.' });
    this.hideDialog();
  }

  runPayroll(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    this.confirmationService.confirm({
      message: `Are you sure you want to run payroll for ${currentMonth} ${currentYear}? This action cannot be undone.`,
      header: 'Confirm Payroll Run',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Placeholder for payroll logic
        this.messageService.add({ severity: 'info', summary: 'Processing', detail: 'Payroll run has been initiated.' });
      }
    });
  }
}
