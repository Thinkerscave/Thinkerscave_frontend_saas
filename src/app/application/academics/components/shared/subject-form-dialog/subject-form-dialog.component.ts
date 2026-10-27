import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs';
import { extractApiError } from '../../../../../shared/utils/api-error.util';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import {
  SUBJECT_CODE_MAX,
  SUBJECT_DESCRIPTION_MAX,
  SUBJECT_NAME_MAX,
  SUBJECT_TYPE_OPTIONS,
  SubjectRequest,
  SubjectResponse,
  SubjectType,
  SubjectTimetablePreference,
  TIMETABLE_PREFERENCE_OPTIONS
} from '../../../models/subjects-mapping.model';

function notBlank(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { blank: true };
}

/** Add / Edit Subject modal. Emits `saved` after the backend confirms; the host decides what happens next. */
@Component({
  selector: 'app-subject-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, DropdownModule],
  templateUrl: './subject-form-dialog.component.html',
  styleUrls: ['./subject-form-dialog.component.scss']
})
export class SubjectFormDialogComponent implements OnChanges {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  /** Null opens the dialog in create mode. */
  @Input() subject: SubjectResponse | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<{ subject: SubjectResponse; created: boolean }>();

  readonly typeOptions = SUBJECT_TYPE_OPTIONS;
  readonly nameMax = SUBJECT_NAME_MAX;
  readonly codeMax = SUBJECT_CODE_MAX;
  readonly descriptionMax = SUBJECT_DESCRIPTION_MAX;
  readonly preferenceOptions = TIMETABLE_PREFERENCE_OPTIONS;

  saving = false;
  submitted = false;
  formError: string | null = null;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(SUBJECT_NAME_MAX), notBlank]],
    code: ['', [Validators.maxLength(SUBJECT_CODE_MAX)]],
    subjectType: [null as SubjectType | null, [Validators.required]],
    defaultLessonDurationMin: [null as number | null],
    defaultTimetablePreference: [null as SubjectTimetablePreference | null],
    description: ['', [Validators.maxLength(SUBJECT_DESCRIPTION_MAX)]]
  });

  get isEdit(): boolean {
    return !!this.subject;
  }

  get descriptionLength(): number {
    return String(this.form.controls.description.value ?? '').length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.resetForm();
    }
  }

  onDialogVisibleChange(next: boolean): void {
    if (this.saving && !next) return;
    this.visibleChange.emit(next);
  }

  close(): void {
    this.onDialogVisibleChange(false);
  }

  fieldError(name: 'name' | 'code' | 'subjectType' | 'description'): string | null {
    const control = this.form.get(name);
    const errors = control?.errors;
    if (!control || !errors || (!control.touched && !this.submitted && !errors['server'])) return null;
    if (errors['server']) return String(errors['server']);
    if (errors['required'] || errors['blank']) {
      return name === 'subjectType' ? 'Select a subject type.' : 'This field is required.';
    }
    if (errors['maxlength']) return `Must be ${errors['maxlength'].requiredLength} characters or fewer.`;
    return 'Invalid value.';
  }

  submit(): void {
    if (this.saving) return;
    this.submitted = true;
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    const value = this.form.getRawValue();
    const body: SubjectRequest = {
      name: String(value.name ?? '').trim(),
      code: String(value.code ?? '').trim() || undefined,
      subjectType: value.subjectType as SubjectType,
      defaultLessonDurationMin: value.defaultLessonDurationMin == null
        || String(value.defaultLessonDurationMin).trim() === ''
        ? null : Number(value.defaultLessonDurationMin),
      defaultTimetablePreference: value.defaultTimetablePreference as SubjectTimetablePreference | null || null,
      description: String(value.description ?? '').trim() || undefined
    };
    const editing = this.subject;
    this.saving = true;
    this.cdr.markForCheck();
    const request$ = editing
      ? this.api.updateSubject(editing.subjectId, body)
      : this.api.createSubject(body);
    request$
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (subject) => {
          this.visibleChange.emit(false);
          this.saved.emit({ subject, created: !editing });
        },
        error: (err) => this.showServerError(err)
      });
  }

  private resetForm(): void {
    this.form.reset({
      name: this.subject?.name ?? '',
      code: this.subject?.code ?? '',
      subjectType: this.subject?.subjectType ?? null,
      defaultLessonDurationMin: this.subject?.defaultLessonDurationMin ?? null,
      defaultTimetablePreference: this.subject?.defaultTimetablePreference ?? null,
      description: this.subject?.description ?? ''
    });
    this.submitted = false;
    this.formError = null;
    this.saving = false;
    this.cdr.markForCheck();
  }

  /** Field errors appear under their inputs; other errors appear in the banner. Typed values are kept. */
  private showServerError(err: unknown): void {
    const parsed = extractApiError(err, 'Unable to save the subject. Please try again.');
    let mappedAny = false;
    for (const [field, message] of Object.entries(parsed.fieldErrors)) {
      const control = this.form.get(field);
      if (!control) continue;
      control.setErrors({ ...(control.errors ?? {}), server: message });
      mappedAny = true;
    }
    this.submitted = true;
    this.formError = mappedAny ? null : parsed.message;
    this.cdr.markForCheck();
  }
}
