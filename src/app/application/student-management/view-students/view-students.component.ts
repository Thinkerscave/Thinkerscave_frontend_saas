import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { StandardListViewComponent } from '../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../shared/components/standard-list-view/list-view-models';
import { LoginService } from '../../../services/login.service';
import { StudentService } from '../student.service';
import { MessageService } from 'primeng/api';

export interface Student {
  id: number;
  studentName: string;
  parentName: string;
  className: string;
  sectionName: string;
  rollNumber: string;
  originalData?: any;
}
@Component({
  selector: 'app-view-students',
  imports: [CommonModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    RippleModule,
    StandardListViewComponent
  ],
  templateUrl: './view-students.component.html',
  styleUrl: './view-students.component.scss'
})
export class ViewStudentsComponent {
  students: Student[] = [];
  @Output() editRequested = new EventEmitter<any>();
  constructor(
    private loginService: LoginService,
    private studentService: StudentService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.studentService.getStudents().subscribe({
      next: (data) => {
        this.students = data.map(s => ({
          id: s.studentId,
          studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          parentName: s.parentName || 'N/A',
          className: s.className || 'N/A',
          sectionName: s.sectionName || 'N/A',
          rollNumber: s.rollNumber || 'N/A',
          originalData: s
        }));
      },
      error: (err) => {
        console.error('Failed to load students:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load students' });
      }
    });
  }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Student Records',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search students...',
      loading: false,
      columns: [
        { field: 'studentName', header: 'Student Name', type: 'text', sortable: true },
        { field: 'parentName', header: 'Parent Name', type: 'text', sortable: true },
        { field: 'className', header: 'Class', type: 'text', sortable: true },
        { field: 'sectionName', header: 'Section', type: 'text', sortable: true },
        { field: 'rollNumber', header: 'Roll No.', type: 'text', sortable: true }
      ],
      rowActions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          isPrimary: true,
          visibleFn: () => this.loginService.getUserPrivileges().includes('STUDENT_ADMISSIONS_EDIT'),
          actionFn: (student: Student) => this.editStudent(student)
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          isPrimary: true,
          color: 'danger',
          visibleFn: () => this.loginService.getUserPrivileges().includes('STUDENT_ADMISSIONS_DELETE'),
          actionFn: (student: Student) => this.deleteStudent(student)
        },
        {
          label: 'Download Info',
          icon: 'pi pi-download',
          isPrimary: false,
          visibleFn: () => this.loginService.getUserPrivileges().includes('STUDENT_ADMISSIONS_VIEW'),
          actionFn: (student: Student) => this.downloadInfo(student)
        },
        {
          label: 'Show Details',
          icon: 'pi pi-eye',
          isPrimary: false,
          visibleFn: () => this.loginService.getUserPrivileges().includes('STUDENT_ADMISSIONS_VIEW'),
          actionFn: (student: Student) => this.showMore(student)
        }
      ]
    };
  }

  // 4. Define placeholder methods for button actions.
  editStudent(student: Student) {
    console.log('Editing student:', student.studentName);
    this.editRequested.emit(student.originalData);
  }

  deleteStudent(student: Student) {
    if (confirm(`Are you sure you want to delete ${student.studentName}?`)) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Student deleted successfully' });
          this.loadStudents();
        },
        error: (err) => {
          console.error('Failed to delete student:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete student' });
        }
      });
    }
  }

  downloadInfo(student: Student) {
    console.log('Downloading info for:', student.studentName);
    // In a real app, you would generate a PDF or CSV file.
  }

  showMore(student: Student) {
    console.log('Showing more details for:', student.studentName);
    // In a real app, you might expand a row or navigate to a details page.
  }
}
