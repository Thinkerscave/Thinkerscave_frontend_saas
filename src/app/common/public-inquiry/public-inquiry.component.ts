import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';

interface ClassOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-public-inquiry',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InputTextModule,
        DropdownModule,
        TextareaModule,
        ButtonModule,
        CardModule,
        ToastModule,
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

    classOptions: ClassOption[] = [
        { label: 'Nursery', value: 'nursery' },
        { label: 'LKG', value: 'lkg' },
        { label: 'UKG', value: 'ukg' },
        { label: 'Class 1', value: 'class-1' },
        { label: 'Class 2', value: 'class-2' },
        { label: 'Class 3', value: 'class-3' },
        { label: 'Class 4', value: 'class-4' },
        { label: 'Class 5', value: 'class-5' },
        { label: 'Class 6', value: 'class-6' },
        { label: 'Class 7', value: 'class-7' },
        { label: 'Class 8', value: 'class-8' },
        { label: 'Class 9', value: 'class-9' },
        { label: 'Class 10', value: 'class-10' },
        { label: 'Class 11 - Science', value: 'class-11-science' },
        { label: 'Class 11 - Commerce', value: 'class-11-commerce' },
        { label: 'Class 11 - Arts', value: 'class-11-arts' },
        { label: 'Class 12 - Science', value: 'class-12-science' },
        { label: 'Class 12 - Commerce', value: 'class-12-commerce' },
        { label: 'Class 12 - Arts', value: 'class-12-arts' }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.initForm();
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
            // Mark all fields as touched to show validation
            Object.keys(this.inquiryForm.controls).forEach(key => {
                const control = this.inquiryForm.get(key);
                control?.markAsTouched();
                control?.markAsDirty();
            });

            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields correctly.',
                life: 4000
            });
            return;
        }

        this.isSubmitting = true;

        // Simulate API call
        setTimeout(() => {
            console.log('Inquiry submitted:', this.inquiryForm.value);

            this.messageService.add({
                severity: 'success',
                summary: 'Inquiry Submitted!',
                detail: 'Thank you for your interest. Our team will contact you shortly.',
                life: 6000
            });

            this.isSubmitting = false;
            this.isSubmitted = true;
        }, 1500);
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
