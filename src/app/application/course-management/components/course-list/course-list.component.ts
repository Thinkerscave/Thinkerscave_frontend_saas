import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CourseService } from '../../services/course.service';
import { Course } from '../../../../shared/models/course.model';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  loading: boolean = true;

  constructor(private courseService: CourseService) { }

  ngOnInit(): void {
    this.courseService.getAllCourses().subscribe({
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
}
