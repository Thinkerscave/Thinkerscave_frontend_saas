import { ChangeDetectorRef, Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AppToastComponent } from '../../core/feedback/app-toast.component';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';
import { PublicInquiryService } from '../../services/public-inquiry.service';

interface ClassOption {
    label: string;
    value: number;
    name: string;
    academicYearId?: number | null;
}

@Component({
    selector: 'app-public-inquiry',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AppToastComponent, 
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InputTextModule,
        DropdownModule,
        TextareaModule,
        ButtonModule,
        CardModule,
        RippleModule,
        DividerModule,
        FloatLabelModule,
        InputMaskModule
    ],
    providers: [MessageService],
    templateUrl: './public-inquiry.component.html',
    styleUrl: './public-inquiry.component.scss'
})
export class PublicInquiryComponent implements OnInit {
    inquiryForm!: FormGroup;
    isSubmitting: boolean = false;
    isSubmitted: boolean = false;

    classOptions: ClassOption[] = [];
    selectedYearId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private inquiryService: PublicInquiryService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.inquiryService.loadFormConfig().subscribe({
            next: res => {
                const data = res.data;
                this.selectedYearId = data?.defaultAcademicYearId ?? null;
                this.classOptions = (data?.classes ?? []).map(c => ({
                    label: c.name,
                    value: c.id,
                    name: c.name,
                    academicYearId: this.selectedYearId
                }));
                this.cdr.markForCheck();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Unavailable',
                    detail: 'Could not load classes for this school.'
                });
            }
        });
    }

    private initForm(): void {
        this.inquiryForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
            email: ['', [Validators.required, Validators.email]],
            classInterested: [null, Validators.required],
            address: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
        });
    }
    onSubmit(): void {
        if (this.inquiryForm.invalid) {
            this.inquiryForm.markAllAsTouched();
            return;
        }
    
        this.isSubmitting = true;
    
        const selected = this.classOptions.find(opt => opt.value === this.inquiryForm.value.classInterested);
        const payload = {
            name: this.inquiryForm.value.name,
            mobileNumber: this.inquiryForm.value.mobileNumber,
            email: this.inquiryForm.value.email,
            classInterestedIn: selected?.name ?? '',
            classId: selected?.value ?? null,
            academicYearId: this.selectedYearId,
            address: this.inquiryForm.value.address,
            inquirySource: 'Website'
        };
    
        this.inquiryService.submitInquiry(payload).subscribe({
            next: () => {
                this.isSubmitted = true;
                this.isSubmitting = false;
    
                this.messageService.add({
                    severity: 'success',
                    summary: 'Inquiry Submitted',
                    detail: 'Our team will contact you shortly'
                });
            },
            error: () => {
                this.isSubmitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Submission Failed',
                    detail: 'Please try again later'
                });
            }
        });
    }

    submitAnotherInquiry(): void {
        this.isSubmitted = false;
        this.inquiryForm.reset();
    }

    // Helper methods for form validation feedback
    isInvalid(controlName: string): boolean {
        const control = this.inquiryForm.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    getErrorMessage(controlName: string): string {
        const control = this.inquiryForm.get(controlName);
        if (!control || !control.errors) return '';

        if (control.errors['required']) {
            return `${this.getFieldLabel(controlName)} is required`;
        }
        if (control.errors['email']) {
            return 'Please enter a valid email address';
        }
        if (control.errors['pattern']) {
            return 'Please enter a valid 10-digit mobile number';
        }
        if (control.errors['minlength']) {
            const minLength = control.errors['minlength'].requiredLength;
            return `Minimum ${minLength} characters required`;
        }
        if (control.errors['maxlength']) {
            const maxLength = control.errors['maxlength'].requiredLength;
            return `Maximum ${maxLength} characters allowed`;
        }

        return 'Invalid value';
    }

    private getFieldLabel(controlName: string): string {
        const labels: { [key: string]: string } = {
            name: 'Name',
            mobileNumber: 'Mobile Number',
            email: 'Email ID',
            classInterested: 'Class',
            address: 'Address'
        };
        return labels[controlName] || controlName;
    }
}
