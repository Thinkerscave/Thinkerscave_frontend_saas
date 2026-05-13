import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SyllabusService } from '../../services/syllabus.service';
import { SyllabusStatus } from '../../../../core/enums/syllabus-status.enum';

@Component({
  selector: 'app-syllabus-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    AccordionModule,
    RouterModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './syllabus-editor.component.html',
  styleUrls: ['./syllabus-editor.component.scss']
})
export class SyllabusEditorComponent implements OnInit, OnChanges {
  @Input() editId: number | null = null;
  @Output() saveComplete = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  syllabusForm: FormGroup;
  isEditMode = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private syllabusService: SyllabusService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
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
    const id = this.route.snapshot.params['id'] || this.editId;
    if (id) {
      this.isEditMode = true;
      this.syllabusService.getSyllabusById(id).subscribe(data => {
        this.syllabusForm.patchValue(data);
      });
    } else {
      if (this.chapters.length === 0) {
        this.addChapter(); // Start with one chapter
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editId'] && !changes['editId'].isFirstChange()) {
      if (this.editId) {
        this.isEditMode = true;
        this.syllabusService.getSyllabusById(this.editId).subscribe(data => {
          this.syllabusForm.patchValue(data);
        });
      } else {
        this.isEditMode = false;
        this.syllabusForm.reset({ version: '1.0', status: SyllabusStatus.DRAFT });
        this.chapters.clear();
        this.addChapter();
      }
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
    if (this.syllabusForm.invalid) {
      this.syllabusForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill in all required fields.' });
      return;
    }

    this.saving = true;
    const currentId = this.editId || this.route.snapshot.params['id'];
    const action = this.isEditMode && currentId
      ? this.syllabusService.updateSyllabus(currentId, this.syllabusForm.value)
      : this.syllabusService.createSyllabus(this.syllabusForm.value);

    action.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Syllabus saved.' });
        setTimeout(() => {
          this.saving = false;
          this.saveComplete.emit();
          if (!this.editId && this.route.snapshot.url.length > 0 && this.route.snapshot.url[0].path !== 'syllabus') {
            this.router.navigate(['/application/academics/syllabus']);
          }
        }, 1000);
      },
      error: (err: any) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save syllabus.' });
        this.saving = false;
      }
    });
  }

  onCancel() {
    this.cancel.emit();
    if (!this.editId && this.route.snapshot.url.length > 0 && this.route.snapshot.url[0].path !== 'syllabus') {
      this.router.navigate(['/application/academics/syllabus']);
    }
  }
}
