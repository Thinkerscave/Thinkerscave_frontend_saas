import { CommonModule } from '@angular/common';
import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { STUDENT_NAV_ITEMS, STUDENT_PROFILE_TABS } from '../../workspaces/data/workflow-workspace.config';
import { WorkflowEmptyStateComponent, WorkflowMetricComponent, WorkflowNavComponent } from '../../workspaces/components/workflow-primitives.component';
import { WorkflowDataService } from '../../workspaces/services/workflow-data.service';
import { AdmissionApplication, ClassRecord, SectionRecord, StudentRecord, StudentWorkspaceData, WorkspaceMetric } from '../../workspaces/models/workflow-workspace.model';
import { InitialsPipe } from '../../../shared/pipes';

type DirectoryView = 'table' | 'grid' | 'cards';

@Component({
  selector: 'app-student-workspace',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, WorkflowNavComponent, WorkflowMetricComponent, WorkflowEmptyStateComponent, InitialsPipe],
  templateUrl: './student-workspace.component.html'
})
export class StudentWorkspaceComponent implements OnInit {
  readonly navItems = STUDENT_NAV_ITEMS;
  readonly profileTabs = STUDENT_PROFILE_TABS;

  page = 'dashboard';
  data: StudentWorkspaceData = { students: [], classes: [], sections: [], documents: [], inquiries: [], admissions: [] };
  loading = true;
  searchTerm = '';
  directoryView: DirectoryView = 'table';
  activeProfileTab = 'Overview';
  selectedStudent?: StudentRecord;

  constructor(private readonly route: ActivatedRoute, private readonly workflowData: WorkflowDataService) { }

  ngOnInit(): void {
    this.page = this.route.snapshot.data['workspacePage'] ?? 'dashboard';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.workflowData.loadStudentWorkspace()
      .pipe(finalize(() => this.loading = false))
      .subscribe(data => {
        this.data = data;
        this.selectedStudent = data.students[0];
      });
  }

  get title(): string {
    return this.navItems.find(item => item.id === this.page)?.label ?? 'Student Management';
  }

  get subtitle(): string {
    return this.navItems.find(item => item.id === this.page)?.description ?? 'Student lifecycle workspace';
  }

  get metrics(): WorkspaceMetric[] {
    const students = this.data.students.length;
    const active = this.data.students.filter(item => this.isActive(item)).length;
    const documents = this.data.documents.length;
    const parents = this.parentGroups().length;
    return [
      { label: 'Total Students', value: students, trend: `${active} active`, tone: 'info', icon: 'pi pi-users' },
      { label: 'Classes', value: this.data.classes.length, trend: `${this.data.sections.length} sections`, tone: 'neutral', icon: 'pi pi-building-columns' },
      { label: 'Documents', value: documents, trend: documents ? 'Available in vault' : 'Awaiting uploads', tone: documents ? 'success' : 'warning', icon: 'pi pi-folder' },
      { label: 'Parents', value: parents, trend: 'Linked guardians', tone: 'success', icon: 'pi pi-address-book' }
    ];
  }

  filteredStudents(): StudentRecord[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.data.students;
    }
    return this.data.students.filter(student => [
      this.studentName(student),
      student.email,
      String(student.mobileNumber ?? ''),
      student.rollNumber,
      student.className,
      student.sectionName,
      student.parentName
    ].some(value => value?.toLowerCase().includes(query)));
  }

  studentName(student: StudentRecord | undefined): string {
    if (!student) {
      return 'Student';
    }
    return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
  }

  isActive(student: StudentRecord): boolean {
    return student.active ?? student.isActive ?? true;
  }

  classStats(): Array<{ classItem: ClassRecord; students: StudentRecord[]; sections: SectionRecord[]; utilization: number }> {
    return this.data.classes.map(classItem => {
      const students = this.data.students.filter(student => String(student.classId) === String(classItem.classId) || student.className === classItem.className);
      const sections = this.data.sections.filter(section => String(section.classEntity?.classId) === String(classItem.classId));
      const utilization = Math.min(100, Math.round((students.length / Math.max(sections.length * 30, 30)) * 100));
      return { classItem, students, sections, utilization };
    });
  }

  sectionStats(): Array<{ section: SectionRecord; students: StudentRecord[]; utilization: number }> {
    return this.data.sections.map(section => {
      const students = this.data.students.filter(student => String(student.sectionId) === String(section.sectionId) || student.sectionName === section.sectionName);
      return { section, students, utilization: Math.min(100, Math.round((students.length / 30) * 100)) };
    });
  }

  parentGroups(): Array<{ name: string; students: StudentRecord[]; classes: string }> {
    const grouped = this.data.students.reduce<Record<string, StudentRecord[]>>((acc, student) => {
      const parent = student.parentName || 'Parent details pending';
      acc[parent] = [...(acc[parent] ?? []), student];
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, students]) => ({
      name,
      students,
      classes: Array.from(new Set(students.map(student => student.className).filter(Boolean))).join(', ')
    }));
  }

  studentDocuments(student: StudentRecord | undefined = this.selectedStudent) {
    if (!student) {
      return [];
    }
    return this.data.documents.filter(document => Number(document.studentId) === Number(student.studentId));
  }

  admissionApplications(): AdmissionApplication[] {
    return this.data.admissions.length ? this.data.admissions : this.data.inquiries
      .filter(inquiry => ['READY_FOR_ADMISSION', 'CONVERTED', 'DOCUMENTS_PENDING'].includes(inquiry.status))
      .map(inquiry => ({
        applicationId: `INQ-${inquiry.inquiryId}`,
        applicantName: inquiry.name,
        applyingForSchoolOrCollege: inquiry.classInterested,
        contactNumber: inquiry.mobileNumber,
        email: inquiry.email,
        uploadedDocuments: [],
        status: inquiry.status === 'CONVERTED' ? 'APPROVED' : 'PENDING'
      }));
  }

  studentByDocument(studentId: number | undefined): string {
    return this.studentName(this.data.students.find(student => Number(student.studentId) === Number(studentId)));
  }

  graduationReadyStudents(): StudentRecord[] {
    return this.data.students.filter(student => /12|xii|senior/i.test(student.className ?? ''));
  }

  nextClassName(className: string | undefined): string {
    if (!className) {
      return 'Next class';
    }
    const numberMatch = className.match(/\d+/);
    if (!numberMatch) {
      return `${className} + 1`;
    }
    return className.replace(numberMatch[0], String(Number(numberMatch[0]) + 1));
  }

  setDirectoryView(view: DirectoryView): void {
    this.directoryView = view;
  }

  selectStudent(student: StudentRecord): void {
    this.selectedStudent = student;
    this.activeProfileTab = 'Overview';
  }
}