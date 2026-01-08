import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

// Services & Models
import { FollowUpService } from '../../services/followup.service';
import { InquiryService } from '../../services/inquiry.service';
import { InquiryWithFollowUp, FollowUp, FollowUpType, FollowUpStatus } from '../../models/followup.model';

@Component({
    selector: 'app-inquiry-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        TextareaModule,
        ToastModule,
        TagModule,
        AvatarModule,
        DividerModule,
        DatePickerModule
    ],
    providers: [MessageService],
    templateUrl: './inquiry-detail.component.html',
    styleUrl: './inquiry-detail.component.scss'
})
export class InquiryDetailComponent implements OnInit {
    // Inquiry data
    inquiry: InquiryWithFollowUp | null = null;
    followUpHistory: FollowUp[] = [];
    loading: boolean = false;

    // Form
    followUpForm!: FormGroup;
    submitting: boolean = false;

    // Dropdown options
    followUpTypes: FollowUpType[] = [];
    followUpStatuses: FollowUpStatus[] = [];
    classOptions: { label: string; value: string }[] = [];

    // Date
    today: Date = new Date();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private fb: FormBuilder,
        private followUpService: FollowUpService,
        private inquiryService: InquiryService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadDropdownOptions();
        this.loadInquiryData();
    }

    private initForm(): void {
        this.followUpForm = this.fb.group({
            followUpType: [null, Validators.required],
            status: [null, Validators.required],
            nextFollowUpDate: [null],
            remarks: ['']
        });
    }

    private loadDropdownOptions(): void {
        this.followUpTypes = this.followUpService.getFollowUpTypes();
        this.followUpStatuses = this.followUpService.getFollowUpStatuses();
        this.classOptions = this.inquiryService.getClassOptions();
    }

    private loadInquiryData(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.router.navigate(['/app/inquiry/followup']);
            return;
        }

        this.loading = true;
        const inquiryId = parseInt(id, 10);

        // Load inquiry details
        this.followUpService.getInquiryById(inquiryId).subscribe({
            next: (inquiry) => {
                if (inquiry) {
                    this.inquiry = inquiry;
                    this.loadFollowUpHistory(inquiryId);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Not Found',
                        detail: 'Inquiry not found.'
                    });
                    this.router.navigate(['/app/inquiry/followup']);
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load inquiry details.'
                });
            }
        });
    }

    private loadFollowUpHistory(inquiryId: number): void {
        this.followUpService.getFollowUpHistory(inquiryId).subscribe({
            next: (history) => {
                this.followUpHistory = history;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/app/inquiry/followup']);
    }

    onSaveFollowUp(): void {
        if (this.followUpForm.invalid || !this.inquiry) {
            Object.keys(this.followUpForm.controls).forEach(key => {
                const control = this.followUpForm.get(key);
                control?.markAsTouched();
                control?.markAsDirty();
            });
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields.'
            });
            return;
        }

        this.submitting = true;
        const formValue = this.followUpForm.value;

        const followUp: FollowUp = {
            inquiryId: this.inquiry.inquiryId,
            followUpType: formValue.followUpType,
            status: formValue.status,
            nextFollowUpDate: formValue.nextFollowUpDate,
            remarks: formValue.remarks,
            followUpDate: new Date()
        };

        this.followUpService.addFollowUp(followUp).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Follow-up added successfully.'
                });
                this.followUpForm.reset();
                this.loadInquiryData();
                this.submitting = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to add follow-up.'
                });
                this.submitting = false;
            }
        });
    }

    onSaveAndConvert(): void {
        if (!this.inquiry) return;

        // First save the follow-up with Converted status
        this.followUpForm.patchValue({ status: 'Converted' });

        if (this.followUpForm.get('followUpType')?.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select a follow-up type.'
            });
            return;
        }

        this.submitting = true;
        const formValue = this.followUpForm.value;

        const followUp: FollowUp = {
            inquiryId: this.inquiry.inquiryId,
            followUpType: formValue.followUpType || 'Meeting',
            status: 'Converted',
            remarks: formValue.remarks || 'Converted to admission',
            followUpDate: new Date()
        };

        this.followUpService.addFollowUp(followUp).subscribe({
            next: () => {
                this.followUpService.convertToAdmission(this.inquiry!.inquiryId).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Converted!',
                            detail: 'Inquiry has been converted to admission.'
                        });
                        this.submitting = false;
                        // Navigate to admission form or stay
                        this.router.navigate(['/app/inquiry/followup'], {
                            queryParams: { tab: 'converted' }
                        });
                    }
                });
            },
            error: () => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to convert inquiry.'
                });
            }
        });
    }

    // Helper methods
    getClassLabel(value: string): string {
        const option = this.classOptions.find(c => c.value === value);
        return option?.label || value;
    }

    getSourceLabel(value: string): string {
        const sources: { [key: string]: string } = {
            'walkin': 'Walk-In',
            'website': 'Website',
            'phone': 'Phone Call',
            'referral': 'Referral',
            'social-media': 'Social Media',
            'advertisement': 'Advertisement'
        };
        return sources[value] || value;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const statusObj = this.followUpStatuses.find(s => s.value === status);
        return statusObj?.severity || 'secondary';
    }

    getFollowUpTypeColor(type: string): string {
        const typeObj = this.followUpTypes.find(t => t.value === type);
        return typeObj?.color || '#6B7280';
    }

    getTimelineColor(status: string): string {
        switch (status) {
            case 'Contacted':
            case 'Converted':
                return '#22C55E';
            case 'Interested':
                return '#3B82F6';
            case 'Call Back':
                return '#F59E0B';
            case 'Not Connected':
                return '#6B7280';
            case 'Lost':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    getAvatarColor(name: string): string {
        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    isInvalid(controlName: string): boolean {
        const control = this.followUpForm.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }
}
