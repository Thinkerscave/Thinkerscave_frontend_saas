import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CourseService } from '../../services/course.service';
import { AcademicStructureService } from '../../../academic-structure/services/academic-structure.service';
import { Subject, SubjectContainerMapping } from '../../../../shared/models/course.model';
import { AcademicContainer } from '../../../../shared/models/academic-container.model';

@Component({
  selector: 'app-subject-mapping',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownModule, ButtonModule],
  templateUrl: './subject-mapping.component.html',
  styleUrls: ['./subject-mapping.component.scss']
})
export class SubjectMappingComponent implements OnInit {
  mappingForm: FormGroup;
  subjects: Subject[] = [];
  containers: AcademicContainer[] = [];
  academicYears: any[] = []; // Load real years

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private structureService: AcademicStructureService
  ) {
    this.mappingForm = this.fb.group({
      subjectId: [null, Validators.required],
      containerId: [null, Validators.required],
      academicYearId: [null, Validators.required],
      isMandatory: [true]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.courseService.getAllSubjects().subscribe((data: Subject[]) => this.subjects = data);
    this.structureService.getAllContainers().subscribe((data: AcademicContainer[]) => this.containers = data);
    // Mock years or fetch from service
    this.academicYears = [{ label: '2024-2025', value: 1 }];
  }

  onSubmit() {
    console.log(this.mappingForm.value);
    // Call service to save mapping
  }
}
