import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CourseService } from '../../services/course.service';
import { AcademicYear } from '../../../../shared/models/course.model';

@Component({
  selector: 'app-academic-year-config',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './academic-year-config.component.html',
  styleUrls: ['./academic-year-config.component.scss']
})
export class AcademicYearConfigComponent implements OnInit {
  years: AcademicYear[] = [];

  constructor(private courseService: CourseService) { }

  ngOnInit(): void {
    this.courseService.getAllAcademicYears().subscribe((data: AcademicYear[]) => this.years = data);
  }
}
