import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tab, TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StandardListViewComponent } from '../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../shared/components/standard-list-view/list-view-models';
import { AttendanceRecord, AttendanceService } from '../../../services/attendance.service';

@Component({
  selector: 'app-class-attendance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TabsModule, Tab,
    TableModule, InputTextModule, DropdownModule, InputTextarea,
    ButtonModule, ToastModule, StandardListViewComponent
  ],
  providers: [MessageService],
  templateUrl: './class-attendance.component.html',
  styleUrl: './class-attendance.component.scss'
})
export class ClassAttendanceComponent implements OnInit {
  attendanceForm!: FormGroup;
  records: AttendanceRecord[] = [];
  statusOptions = [
    { label: 'Present', value: 'PRESENT' },
    { label: 'Absent', value: 'ABSENT' },
    { label: 'Late', value: 'LATE' },
    { label: 'Excused', value: 'EXCUSED' }
  ];
  activeTab = '0';
  isEditing = false;
  editingRecordId: number | null = null;
  loading = false;
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private messageService: MessageService
  ) { this.initForm(); }

  ngOnInit(): void { this.loadRecords(); }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Class Attendance Records',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search...',
      loading: this.loading,
      columns: [
        { field: 'referenceName', header: 'Student Name', type: 'text', sortable: true },
        { field: 'className', header: 'Class', type: 'text', sortable: true },
        { field: 'sectionName', header: 'Section', type: 'text', sortable: true },
        { field: 'attendanceDate', header: 'Date', type: 'date', sortable: true },
        { field: 'status', header: 'Status', type: 'badge', sortable: true },
        { field: 'remarks', header: 'Remarks', type: 'text', sortable: false }
      ],
      rowActions: [
        { label: 'Edit', icon: 'pi pi-pencil', isPrimary: true, actionFn: (r: AttendanceRecord) => this.onEditRecord(r) },
        { label: 'Delete', icon: 'pi pi-trash', isPrimary: true, color: 'danger', actionFn: (r: AttendanceRecord) => this.onDeleteRecord(r) }
      ]
    };
  }

  private loadRecords(): void {
    this.loading = true;
    this.attendanceService.getTodayClassAttendance().subscribe({
      next: (data) => { this.records = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  private initForm(): void {
    this.attendanceForm = this.fb.group({
      referenceName: ['', Validators.required],
      attendanceDate: [this.today, Validators.required],
      className: [''],
      sectionName: [''],
      status: ['PRESENT', Validators.required],
      remarks: [''],
    });
  }

  onSubmit(): void {
    if (this.attendanceForm.invalid) { this.attendanceForm.markAllAsTouched(); return; }
    const payload: AttendanceRecord = { ...this.attendanceForm.value, attendanceType: 'CLASS' };
    this.attendanceService.save(payload).subscribe({
      next: (saved) => {
        this.records = [...this.records, saved];
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Attendance recorded' });
        this.resetForm();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save attendance' })
    });
  }

  onEditRecord(record: AttendanceRecord): void {
    this.attendanceForm.patchValue({
      referenceName: record.referenceName,
      attendanceDate: record.attendanceDate,
      className: record.className,
      sectionName: record.sectionName,
      status: record.status,
      remarks: record.remarks
    });
    this.editingRecordId = record.id!;
    this.isEditing = true;
    this.activeTab = '0';
  }

  onUpdateRecord(): void {
    if (!this.isEditing || this.editingRecordId === null || this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched(); return;
    }
    this.attendanceService.update(this.editingRecordId, this.attendanceForm.value).subscribe({
      next: (updated) => {
        this.records = this.records.map(r => r.id === this.editingRecordId ? updated : r);
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Attendance updated' });
        this.resetForm();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update' })
    });
  }

  onDeleteRecord(record: AttendanceRecord): void {
    if (!confirm(`Delete attendance for ${record.referenceName}?`)) return;
    this.attendanceService.delete(record.id!).subscribe({
      next: () => {
        this.records = this.records.filter(r => r.id !== record.id);
        if (this.editingRecordId === record.id) this.resetForm();
        this.messageService.add({ severity: 'info', summary: 'Deleted' });
      }
    });
  }

  resetForm(): void {
    this.attendanceForm.reset({ referenceName: '', attendanceDate: this.today, status: 'PRESENT', remarks: '' });
    this.isEditing = false; this.editingRecordId = null;
  }
}
