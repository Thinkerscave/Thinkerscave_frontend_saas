import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tab, TabsModule } from 'primeng/tabs';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

interface AttendanceRecord {
  id: number;
  name: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks: string;
}

@Component({
  selector: 'app-class-attendance',
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
  templateUrl: './class-attendance.component.html',
  styleUrl: './class-attendance.component.scss'
})
export class ClassAttendanceComponent {
  attendanceForm!: FormGroup;
  records: AttendanceRecord[] = [];
  statusOptions = ['Present', 'Absent', 'Late', 'Excused'];
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
      name: ['', Validators.required],
      date: ['', Validators.required],
      status: ['Present', Validators.required],
      remarks: [''],
    });
  }

  private seedRecords(): void {
    this.records = [
      {
        id: 1,
        name: 'Aarav Sharma',
        date: '2024-11-15',
        status: 'Present',
        remarks: 'On time',
      },
      {
        id: 2,
        name: 'Diya Gupta',
        date: '2024-11-15',
        status: 'Late',
        remarks: 'Traffic delay',
      },
      {
        id: 3,
        name: 'Kabir Kumar',
        date: '2024-11-15',
        status: 'Absent',
        remarks: 'Sick leave',
      },
      {
        id: 4,
        name: 'Myra Reddy',
        date: '2024-11-14',
        status: 'Present',
        remarks: 'Participated in lab',
      },
      {
        id: 5,
        name: 'Rhea Mishra',
        date: '2024-11-14',
        status: 'Excused',
        remarks: 'Official event',
      },
    ];
  }

  onSubmit(): void {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    const newRecord: AttendanceRecord = {
      id: this.generateId(),
      ...this.attendanceForm.value,
    };

    this.records = [...this.records, newRecord];
    this.resetForm();
  }

  onEditRecord(record: AttendanceRecord): void {
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

    const updatedRecord: AttendanceRecord = {
      id: this.editingRecordId,
      ...this.attendanceForm.value,
    };

    this.records = this.records.map(record =>
      record.id === this.editingRecordId ? updatedRecord : record
    );

    this.resetForm();
  }

  onDeleteRecord(record: AttendanceRecord): void {
    const confirmed = confirm(`Delete attendance for ${record.name} on ${record.date}?`);
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
      name: '',
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
