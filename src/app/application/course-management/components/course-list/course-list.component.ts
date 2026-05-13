import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { CourseService } from '../../services/course.service';
import { Course } from '../../../../shared/models/course.model';
import { LoginService } from '../../../../services/login.service';
import { StandardListViewComponent } from '../../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../../shared/components/standard-list-view/list-view-models';
import { TenantConfigService, TenantConfig } from '../../../../services/tenant-config.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    InputNumberModule,
    TooltipModule,
    TagModule,
    TabsModule,
    StandardListViewComponent
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  loading: boolean = true;
  courseDialog: boolean = false;
  activeTabIndex: number = 1; // Default to View tab
  course: Course = this.createEmptyCourse();
  addCourseObj: Course = this.createEmptyCourse();
  submitted: boolean = false;
  orgId: number;
  tenantConfig: TenantConfig | null = null;

  constructor(
    private courseService: CourseService,
    private loginService: LoginService,
    private router: Router,
    private tenantConfigService: TenantConfigService
  ) {
    this.orgId = this.loginService.getUser()?.organizationId || 1;
    this.tenantConfig = this.tenantConfigService.getConfig();
  }

  get listViewConfig(): ListViewConfig {
    const title = this.tenantConfig ? `${this.tenantConfig.courseLabel} Directory` : 'Academic Programs';
    return {
      title: title,
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: `Search ${this.tenantConfig?.courseLabel?.toLowerCase() || 'courses'}...`,
      loading: this.loading,
      primaryAction: {
        label: `Add ${this.tenantConfig ? this.tenantConfig.courseLabel : 'Course'}`,
        icon: 'pi pi-plus',
        visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_COURSES_ADD'),
        actionFn: () => {
          this.activeTabIndex = 0; // Switch to Add tab
          this.addCourseObj = this.createEmptyCourse();
          this.submitted = false;
        }
      },
      columns: [
        { field: 'courseCode', header: 'Code', type: 'text', sortable: true, width: '150px' },
        { field: 'courseName', header: 'Name', type: 'text', sortable: true },
        { field: 'category', header: 'Category', type: 'badge', sortable: true },
        {
          field: 'duration',
          header: 'Duration',
          type: 'text',
          valueGetter: (course) => `${course.durationYears} Years (${course.totalSemesters} Sem)`
        }
      ],
      rowActions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          isPrimary: true,
          visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_COURSES_EDIT'),
          actionFn: (course) => this.editCourse(course)
        },
        {
          label: 'Curriculum Mapping',
          icon: 'pi pi-sitemap',
          isPrimary: true,
          color: 'info',
          visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_SUBJECTS_VIEW'),
          actionFn: (course) => this.manageCurriculum(course)
        }
      ]
    };
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses() {
    this.loading = true;
    this.courseService.getAllCoursesByOrg(this.orgId).subscribe({
      next: (data: Course[]) => {
        this.courses = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  openNew() {
    this.addCourseObj = this.createEmptyCourse();
    this.submitted = false;
    this.activeTabIndex = 0;
  }

  editCourse(course: Course) {
    this.course = { ...course };
    this.courseDialog = true;
  }

  hideDialog() {
    this.courseDialog = false;
    this.submitted = false;
  }

  saveAddCourse() {
    this.submitted = true;
    if (this.addCourseObj.courseName?.trim() && this.addCourseObj.courseCode?.trim()) {
      this.courseService.createCourse(this.addCourseObj).subscribe(() => {
        this.loadCourses();
        this.addCourseObj = this.createEmptyCourse();
        this.submitted = false;
        this.activeTabIndex = 1; // Switch back to View tab
      });
    }
  }

  saveEditCourse() {
    this.submitted = true;
    if (this.course.courseName?.trim() && this.course.courseCode?.trim()) {
      this.courseService.updateCourse(this.course.courseId as number, this.course).subscribe(() => {
        this.loadCourses();
        this.hideDialog();
      });
    }
  }

  manageCurriculum(course: Course) {
    this.router.navigate(['/application/academics/subjects'], { queryParams: { courseId: course.courseId } });
  }

  createEmptyCourse(): Course {
    return {
      courseName: '',
      courseCode: '',
      organisationId: this.orgId,
      description: '',
      durationYears: 4,
      totalSemesters: 8,
      category: 'GENERAL'
    };
  }
}
