import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tab, TabsModule } from 'primeng/tabs';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

interface HostelAttendanceRecord {
  id: number;
  residentName: string;
  roomNumber: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Night-Out';
  remarks: string;
}

@Component({
  selector: 'app-hostel-attendance',
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
  templateUrl: './hostel-attendance.component.html',
  styleUrl: './hostel-attendance.component.scss'
})
export class HostelAttendanceComponent {
  attendanceForm!: FormGroup;
  records: HostelAttendanceRecord[] = [];
  statusOptions = ['Present', 'Absent', 'Late', 'Night-Out'];
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
      residentName: ['', Validators.required],
      roomNumber: ['', Validators.required],
      date: ['', Validators.required],
      status: ['Present', Validators.required],
      remarks: [''],
    });
  }

  private seedRecords(): void {
    this.records = [
      {
        id: 1,
        residentName: 'Rahul Menon',
        roomNumber: 'B203',
        date: '2024-11-15',
        status: 'Present',
        remarks: 'Checked-in at 9 PM',
      },
      {
        id: 2,
        residentName: 'Sneha R',
        roomNumber: 'B110',
        date: '2024-11-15',
        status: 'Late',
        remarks: 'Returned at 11 PM',
      },
      {
        id: 3,
        residentName: 'Vikram Singh',
        roomNumber: 'A305',
        date: '2024-11-15',
        status: 'Night-Out',
        remarks: 'Approved by warden',
      },
      {
        id: 4,
        residentName: 'Lakshmi Rao',
        roomNumber: 'C101',
        date: '2024-11-14',
        status: 'Absent',
        remarks: 'Weekend home visit',
      },
      {
        id: 5,
        residentName: 'Arjun Das',
        roomNumber: 'B207',
        date: '2024-11-14',
        status: 'Present',
        remarks: 'Lights out at 10 PM',
      },
    ];
  }

  onSubmit(): void {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    const newRecord: HostelAttendanceRecord = {
      id: this.generateId(),
      ...this.attendanceForm.value,
    };

    this.records = [...this.records, newRecord];
    this.resetForm();
  }

  onEditRecord(record: HostelAttendanceRecord): void {
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

    const updatedRecord: HostelAttendanceRecord = {
      id: this.editingRecordId,
      ...this.attendanceForm.value,
    };

    this.records = this.records.map(record =>
      record.id === this.editingRecordId ? updatedRecord : record
    );

    this.resetForm();
  }

  onDeleteRecord(record: HostelAttendanceRecord): void {
    const confirmed = confirm(`Delete attendance for ${record.residentName}?`);
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
      residentName: '',
      roomNumber: '',
      date: '',
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
