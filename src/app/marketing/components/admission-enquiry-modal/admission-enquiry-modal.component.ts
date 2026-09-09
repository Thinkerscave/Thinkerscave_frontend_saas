import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PublicClassOption,
  PublicInquiryResponse,
  PublicInquiryService,
  PublicInquirySubmitRequest
} from '../../../services/public-inquiry.service';
import { AdmissionEnquiryService } from '../../../services/admission-enquiry.service';

@Component({
  selector: 'tc-admission-enquiry-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admission-enquiry-modal.component.html',
  styleUrl: './admission-enquiry-modal.component.scss'
})
export class AdmissionEnquiryModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicInquiry = inject(PublicInquiryService);

  readonly enquiry = inject(AdmissionEnquiryService);

  readonly classes = signal<PublicClassOption[]>([]);
  readonly classesLoading = signal(false);
  readonly classesLoaded = signal(false);
  readonly submitting = signal(false);
  readonly success = signal(false);
  readonly result = signal<PublicInquiryResponse | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.group({
    studentName: ['', [Validators.maxLength(100)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    classId: [null as number | null, Validators.required],
    consent: [false, Validators.requiredTrue]
  });

  constructor() {
    effect(() => {
      if (this.enquiry.visible()) {
        this.resetForm();
        if (!this.classesLoaded()) {
          this.loadClasses();
        }
      }
    });
    effect(() => {
      document.body.style.overflow = this.enquiry.visible() ? 'hidden' : '';
    });
  }

  get studentName() {
    return this.form.get('studentName');
  }

  get mobileNumber() {
    return this.form.get('mobileNumber');
  }

  get classId() {
    return this.form.get('classId');
  }

  get consent() {
    return this.form.get('consent');
  }

  onMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.mobileNumber?.setValue(digits, { emitEvent: false });
  }

  loadClasses(): void {
    this.classesLoading.set(true);
    this.classesLoaded.set(true);
    this.formError.set(null);
    this.publicInquiry.loadFormConfig().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.classesLoading.set(false);
        this.classes.set(res.data?.classes ?? []);
      },
      error: () => {
        this.classesLoading.set(false);
        this.formError.set('Unable to load classes. Please try again.');
      }
    });
  }

  onSubmit(): void {
    this.submitError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const payload: PublicInquirySubmitRequest = {
      studentName: (values.studentName ?? '').trim() || undefined,
      mobileNumber: (values.mobileNumber ?? '').trim(),
      classId: values.classId as number,
      consent: true
    };
    this.submitting.set(true);
    this.publicInquiry.submitInquiry(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.submitting.set(false);
        this.result.set(res.data ?? null);
        this.success.set(true);
      },
      error: err => {
        this.submitting.set(false);
        this.submitError.set(this.mapError(err));
      }
    });
  }

  close(): void {
    this.enquiry.close();
  }

  retryLoadClasses(): void {
    this.classesLoaded.set(false);
    this.loadClasses();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  private resetForm(): void {
    this.form.reset({ studentName: '', mobileNumber: '', classId: null, consent: false });
    this.submitError.set(null);
    this.success.set(false);
    this.result.set(null);
  }

  private mapError(err: unknown): string {
    type ApiErr = { error?: { message?: string; errors?: Array<{ message?: string }> } };
    const api = (err as ApiErr)?.error;
    const first = api?.errors?.[0]?.message;
    return first || api?.message || 'Something went wrong. Please try again.';
  }
}