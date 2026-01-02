import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { SyllabusService } from '../../services/syllabus.service';
import { SyllabusStatus } from '../../../../core/enums/syllabus-status.enum';

@Component({
  selector: 'app-syllabus-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, AccordionModule, RouterModule],
  templateUrl: './syllabus-editor.component.html',
  styleUrls: ['./syllabus-editor.component.scss']
})
export class SyllabusEditorComponent implements OnInit {
  syllabusForm: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private syllabusService: SyllabusService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.syllabusForm = this.fb.group({
      syllabusCode: ['', Validators.required],
      version: ['1.0'],
      status: [SyllabusStatus.DRAFT],
      chapters: this.fb.array([])
    });
  }

  get chapters() {
    return this.syllabusForm.get('chapters') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.syllabusService.getSyllabusById(id).subscribe(data => {
        this.syllabusForm.patchValue(data);
        // Logic to patch nested form arrays (Chapters/Topics) would go here
        // For brevity, assuming simple patch or manual loop
      });
    } else {
      this.addChapter(); // Start with one chapter
    }
  }

  addChapter() {
    const chapter = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      topics: this.fb.array([])
    });
    this.chapters.push(chapter);
  }

  getTopics(chapterIndex: number) {
    return this.chapters.at(chapterIndex).get('topics') as FormArray;
  }

  addTopic(chapterIndex: number) {
    const topic = this.fb.group({
      name: ['', Validators.required],
      estimatedMinutes: [30]
    });
    this.getTopics(chapterIndex).push(topic);
  }

  onSubmit() {
    if (this.syllabusForm.invalid) return;
    const action = this.isEditMode
      ? this.syllabusService.updateSyllabus(this.route.snapshot.params['id'], this.syllabusForm.value)
      : this.syllabusService.createSyllabus(this.syllabusForm.value);

    action.subscribe({
      next: () => this.router.navigate(['/app/academics/syllabus']),
      error: (err: any) => console.error(err)
    });
  }
}
