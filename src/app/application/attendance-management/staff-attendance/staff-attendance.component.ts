import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tab, TabsModule } from 'primeng/tabs';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

interface StaffAttendanceRecord {
  id: number;
  staffName: string;
  department: string;
  date: string;
  shift: string;
  status: 'Present' | 'Absent' | 'On Leave' | 'WFH';
  remarks: string;
}

@Component({
  selector: 'app-staff-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    Tab,
    TableModule,
    InputTextModule,
    DropdownModule,
    InputTextarea,
    ButtonModule,
  ],
  templateUrl: './staff-attendance.component.html',
  styleUrl: './staff-attendance.component.scss'
})
export class StaffAttendanceComponent {
  attendanceForm!: FormGroup;
  records: StaffAttendanceRecord[] = [];
  statusOptions = ['Present', 'Absent', 'On Leave', 'WFH'];
  shiftOptions = ['Morning', 'Evening', 'Night'];
  activeTab = '0';
  isEditing = false;
  editingRecordId: number | null = null;
  globalFilterValue = '';

  constructor(private fb: FormBuilder) {
    this.initForm();
    this.seedRecords();
  }

  private initForm(): void {
    this.attendanceForm = this.fb.group({
      staffName: ['', Validators.required],
      department: ['', Validators.required],
      date: ['', Validators.required],
      shift: ['Morning', Validators.required],
      status: ['Present', Validators.required],
      remarks: [''],
    });
  }

  private seedRecords(): void {
    this.records = [
      {
        id: 1,
        staffName: 'Priya Nair',
        department: 'Academics',
        date: '2024-11-15',
        shift: 'Morning',
        status: 'Present',
        remarks: 'Conducted physics lecture',
      },
      {
        id: 2,
        staffName: 'Rahul Joshi',
        department: 'Administration',
        date: '2024-11-15',
        shift: 'Morning',
        status: 'WFH',
        remarks: 'Working remotely',
      },
      {
        id: 3,
        staffName: 'Meera Iyer',
        department: 'Finance',
        date: '2024-11-15',
        shift: 'Morning',
        status: 'On Leave',
        remarks: 'Medical leave',
      },
      {
        id: 4,
        staffName: 'Kunal Singh',
        department: 'Support',
        date: '2024-11-14',
        shift: 'Evening',
        status: 'Present',
        remarks: 'Handled helpdesk',
      },
      {
        id: 5,
        staffName: 'Anita Rao',
        department: 'HR',
        date: '2024-11-14',
        shift: 'Morning',
        status: 'Absent',
        remarks: 'Family emergency',
      },
    ];
  }

  onSubmit(): void {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    const newRecord: StaffAttendanceRecord = {
      id: this.generateId(),
      ...this.attendanceForm.value,
    };

    this.records = [...this.records, newRecord];
    this.resetForm();
  }

  onEditRecord(record: StaffAttendanceRecord): void {
    this.attendanceForm.patchValue(record);
    this.editingRecordId = record.id;
    this.isEditing = true;
    this.activeTab = '0';
  }

  onUpdateRecord(): void {
    if (!this.isEditing || this.editingRecordId === null || this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    const updatedRecord: StaffAttendanceRecord = {
      id: this.editingRecordId,
      ...this.attendanceForm.value,
    };

    this.records = this.records.map(record =>
      record.id === this.editingRecordId ? updatedRecord : record
    );

    this.resetForm();
  }

  onDeleteRecord(record: StaffAttendanceRecord): void {
    const confirmed = confirm(`Delete attendance for ${record.staffName}?`);
    if (!confirmed) {
      return;
    }

    this.records = this.records.filter(item => item.id !== record.id);

    if (this.editingRecordId === record.id) {
      this.resetForm();
    }
  }

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;
    table.filterGlobal(value, 'contains');
  }

  resetForm(): void {
    this.attendanceForm.reset({
      staffName: '',
      department: '',
      date: '',
      shift: 'Morning',
      status: 'Present',
      remarks: '',
    });
    this.attendanceForm.markAsPristine();
    this.attendanceForm.markAsUntouched();
    this.isEditing = false;
    this.editingRecordId = null;
  }

  private generateId(): number {
    return this.records.length ? Math.max(...this.records.map(record => record.id)) + 1 : 1;
  }
}
