import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { StandardListViewComponent } from '../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../shared/components/standard-list-view/list-view-models';
import { PayrollDTO, PayrollService } from '../../../services/payroll.service';

@Component({
  selector: 'app-manage-salary',
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule,
    InputTextModule, DialogModule, InputNumberModule,
    ConfirmDialogModule, ToastModule, StandardListViewComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manage-salary.component.html',
  styleUrl: './manage-salary.component.scss'
})
export class ManageSalaryComponent implements OnInit {
  staffSalaries: PayrollDTO[] = [];
  salaryDialogVisible = false;
  salaryForm!: FormGroup;
  loading = false;
  private selectedPayroll: PayrollDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadPayroll();
  }

  private initForm(): void {
    this.salaryForm = this.fb.group({
      basic: [0, Validators.required],
      hra: [0, Validators.required],
      specialAllowance: [0, Validators.required],
      academicAllowance: [0, Validators.required],
      medicalAllowance: [0, Validators.required],
      travelAllowance: [0, Validators.required],
      dearnessAllowance: [0, Validators.required],
      otherAllowance: [0, Validators.required],
      professionalTax: [0, Validators.required],
      incomeTax: [0, Validators.required],
      providentFund: [0, Validators.required],
    });
  }

  private loadPayroll(): void {
    this.loading = true;
    this.payrollService.getAllPayroll().subscribe({
      next: (data) => { this.staffSalaries = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Manage Employee Salaries',
      isClientSide: true, showSearch: true, searchPlaceholder: 'Search...', loading: this.loading,
      primaryAction: {
        label: 'Run Payroll', icon: 'pi pi-cog', color: 'secondary',
        actionFn: () => this.runPayroll()
      },
      columns: [
        { field: 'staffName', header: 'Name', type: 'text', sortable: true },
        { field: 'staffId', header: 'Employee ID', type: 'text', sortable: true },
        { field: 'department', header: 'Department', type: 'text', sortable: true },
        {
          field: 'ctcAnnual', header: 'CTC (Annual)', type: 'text', sortable: true,
          valueGetter: (p: PayrollDTO) => p.ctcAnnual
            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.ctcAnnual)
            : '—'
        },
        {
          field: 'netSalary', header: 'Net Salary', type: 'text', sortable: true,
          valueGetter: (p: PayrollDTO) => p.netSalary
            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.netSalary)
            : '—'
        }
      ],
      rowActions: [
        { label: 'Edit', icon: 'pi pi-pencil', isPrimary: true, actionFn: (p: PayrollDTO) => this.editSalary(p) }
      ]
    };
  }

  get grossSalary(): number {
    const v = this.salaryForm.value;
    return (v.basic || 0) + (v.hra || 0) + (v.specialAllowance || 0) + (v.academicAllowance || 0) + (v.medicalAllowance || 0) + (v.travelAllowance || 0) + (v.dearnessAllowance || 0) + (v.otherAllowance || 0);
  }

  get totalDeductions(): number {
    const v = this.salaryForm.value;
    return (v.professionalTax || 0) + (v.incomeTax || 0) + (v.providentFund || 0);
  }

  get netSalary(): number { return this.grossSalary - this.totalDeductions; }

  editSalary(payroll: PayrollDTO): void {
    this.selectedPayroll = payroll;
    this.salaryForm.patchValue(payroll);
    this.salaryDialogVisible = true;
  }

  hideDialog(): void { this.salaryDialogVisible = false; this.selectedPayroll = null; }

  saveSalary(): void {
    if (this.salaryForm.invalid || !this.selectedPayroll) return;
    const dto: PayrollDTO = { ...this.selectedPayroll, ...this.salaryForm.value };
    this.payrollService.saveOrUpdate(dto).subscribe({
      next: (updated) => {
        this.staffSalaries = this.staffSalaries.map(p => p.staffId === updated.staffId ? updated : p);
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Salary updated successfully' });
        this.hideDialog();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save salary' })
    });
  }

  runPayroll(): void {
    const now = new Date();
    const monthYear = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();
    this.confirmationService.confirm({
      message: `Run payroll for ${monthYear}? This will calculate net pay for all staff.`,
      header: 'Confirm Payroll Run',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.payrollService.runPayroll().subscribe({
          next: (result) => {
            this.messageService.add({
              severity: 'success', summary: 'Payroll Processed',
              detail: `${result.totalStaff} staff processed. Total net: ₹${result.totalNet?.toLocaleString('en-IN')}`
            });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Payroll run failed' })
        });
      }
    });
  }
}
