import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { PickListModule } from 'primeng/picklist';
import { CourseService } from '../../services/course.service';
import { Course, Subject } from '../../../../shared/models/course.model';
import { LoginService } from '../../../../services/login.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-subject-mapping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    ButtonModule,
    TabViewModule,
    PickListModule
  ],
  templateUrl: './subject-mapping.component.html',
  styleUrls: ['./subject-mapping.component.scss']
})
export class SubjectMappingComponent implements OnInit {
  courses: Course[] = [];
  selectedCourse: Course | null = null;

  allSubjects: Subject[] = []; // Master list
  availableSubjects: Subject[] = []; // Left side of PickList
  assignedSubjects: { [semester: number]: Subject[] } = {}; // Right side per semester

  semesters: number[] = [];
  activeSemesterIndex: number = 0;
  saving: boolean = false;
  orgId: number;

  constructor(
    private courseService: CourseService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.orgId = this.loginService.getUser()?.organizationId || 1;
  }

  ngOnInit(): void {
    // Fetch initial data
    this.courseService.getAllCoursesByOrg(this.orgId).subscribe(courses => this.courses = courses);
    this.courseService.getAllSubjectsByOrg(this.orgId).subscribe(subjects => {
      this.allSubjects = subjects;
      this.availableSubjects = [...this.allSubjects];
    });

    // Check query params
    this.route.queryParams.subscribe(params => {
      const courseId = params['courseId'];
      if (courseId) {
        this.courseService.getCourseById(+courseId).subscribe(course => {
          this.selectedCourse = course;
          this.onCourseSelect();
        });
      }
    });
  }

  onCourseSelect() {
    if (!this.selectedCourse) return;

    // Generate semester array
    const total = this.selectedCourse.totalSemesters || 2;
    this.semesters = Array(total).fill(0).map((x, i) => i + 1);

    // Reset assignments
    this.assignedSubjects = {};
    this.semesters.forEach(s => this.assignedSubjects[s] = []);

    // Fetch existing mappings
    if (this.selectedCourse.courseId) {
      this.courseService.getSubjectsByCourse(this.selectedCourse.courseId).subscribe(mappings => {
        mappings.forEach(m => {
          const subject = this.allSubjects.find(s => s.subjectId === m.subjectId);
          if (subject && m.semester) {
            this.assignedSubjects[m.semester].push(subject);
          }
        });
        this.refreshAvailableSubjects();
      });
    }
  }

  refreshAvailableSubjects() {
    this.updatePickListForTab(this.activeSemesterIndex + 1);
  }

  updatePickListForTab(semester: number) {
    const assignedIds = (this.assignedSubjects[semester] || []).map(s => s.subjectId);
    this.availableSubjects = this.allSubjects.filter(s => !assignedIds.includes(s.subjectId));
  }

  onMoveToTarget(event: any, semester: number) {
    // Handled by PickList
  }

  onMoveToSource(event: any, semester: number) {
    // Handled by PickList
  }

  saveMapping(semester: number) {
    if (!this.selectedCourse?.courseId) return;

    this.saving = true;
    const subjects = this.assignedSubjects[semester] || [];

    // Call assignment for each subject
    const requests = subjects.map(s =>
      this.courseService.assignSubjectToCourse(this.selectedCourse!.courseId!, s.subjectId!, semester)
    );

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: () => {
          this.saving = false;
        },
        error: () => this.saving = false
      });
    } else {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/application/academics/courses']);
  }
}
