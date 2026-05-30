import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { CourseService } from '../../services/course.service';
import { AcademicYear } from '../../../../shared/models/course.model';
import { SemesterListComponent } from '../semester-list/semester-list.component';
import { LoginService } from '../../../../core/services/login.service';
import { StandardListViewComponent } from '../../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../../shared/components/standard-list-view/list-view-models';
import { AutofocusDirective } from '../../../../shared/directives';

@Component({
  selector: 'app-academic-year-config',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    SemesterListComponent,
    StandardListViewComponent,
    AutofocusDirective
  ],
  templateUrl: './academic-year-config.component.html',
  styleUrls: ['./academic-year-config.component.scss']
})
export class AcademicYearConfigComponent implements OnInit {
  years: AcademicYear[] = [];
  yearDialog: boolean = false;
  year: AcademicYear = this.createEmptyYear();
  submitted: boolean = false;
  orgId: number;

  // Semester Management
  semestersDialog: boolean = false;
  selectedYearForSemesters: AcademicYear | null = null;

  constructor(
    private courseService: CourseService,
    private loginService: LoginService
  ) {
    this.orgId = this.loginService.getUser()?.organizationId || 1;
  }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Academic Years',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search years...',
      loading: false, // loading state is not explicitly managed in original component
      primaryAction: {
        label: 'Add Academic Year',
        icon: 'pi pi-plus',
        visibleFn: () => this.loginService.getUserPrivileges().includes('ACADEMIC_STRUCTURE_ADD'),
        actionFn: () => this.openNew()
      },
      columns: [
        { field: 'yearCode', header: 'Name', type: 'text', sortable: true },
        { field: 'startDate', header: 'Start Date', type: 'date', sortable: true },
        { field: 'endDate', header: 'End Date', type: 'date', sortable: true },
        { field: 'isActive', header: 'Status', type: 'badge', sortable: true, valueGetter: (y) => y.isActive ? 'Current' : 'Past' }
      ],
      rowActions: [
        {
          label: 'Edit Year',
          icon: 'pi pi-pencil',
          isPrimary: true,
          visibleFn: () => this.loginService.getUserPrivileges().includes('ACADEMIC_STRUCTURE_EDIT'),
          actionFn: (year) => this.editYear(year)
        },
        {
          label: 'Manage Semesters',
          icon: 'pi pi-calendar-plus',
          isPrimary: true,
          color: 'info',
          visibleFn: () => this.loginService.getUserPrivileges().includes('ACADEMIC_STRUCTURE_EDIT'),
          actionFn: (year) => this.manageSemesters(year)
        },
        {
          label: 'Set as Current',
          icon: 'pi pi-check-circle',
          isPrimary: true,
          color: 'success',
          visibleFn: (year) => !year.isActive && this.loginService.getUserPrivileges().includes('ACADEMIC_STRUCTURE_EDIT'),
          actionFn: (year) => this.setAsCurrent(year)
        }
      ]
    };
  }

  ngOnInit(): void {
    this.loadYears();
  }

  loadYears() {
    this.courseService.getAllAcademicYears(this.orgId).subscribe((data: AcademicYear[]) => this.years = data);
  }

  openNew() {
    this.year = this.createEmptyYear();
    this.submitted = false;
    this.yearDialog = true;
  }

  editYear(year: AcademicYear) {
    this.year = { ...year };
    this.yearDialog = true;
  }

  hideDialog() {
    this.yearDialog = false;
    this.submitted = false;
  }

  saveYear() {
    this.submitted = true;

    if (this.year.yearCode?.trim()) {
      // Backend createAcademicYear handles both create and theoretically update via params
      this.courseService.createAcademicYear(this.orgId, this.year).subscribe(() => {
        this.loadYears();
        this.hideDialog();
      });
    }
  }

  setAsCurrent(year: AcademicYear) {
    const yearId = year.academicYearId || year.id;
    if (yearId) {
      this.courseService.setAcademicYearAsCurrent(this.orgId, yearId).subscribe(() => {
        this.loadYears();
      });
    }
  }

  manageSemesters(year: AcademicYear) {
    this.selectedYearForSemesters = year;
    this.semestersDialog = true;
  }

  createEmptyYear(): AcademicYear {
    return {
      yearCode: '',
      startDate: '',
      endDate: '',
      isActive: false
    };
  }
}
