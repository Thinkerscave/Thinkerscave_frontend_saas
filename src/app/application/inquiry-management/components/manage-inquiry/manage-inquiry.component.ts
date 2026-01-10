import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

// PrimeNG Modules
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services & Models
import { InquiryService } from '../../services/inquiry.service';
import { Inquiry, InquirySource, ClassOption } from '../../models/inquiry.model';

@Component({
    selector: 'app-manage-inquiry',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TabViewModule,
        CardModule,
        InputTextModule,
        DropdownModule,
        TextareaModule,
        ButtonModule,
        TableModule,
        ToastModule,
        TooltipModule,
        InputSwitchModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule,
        TagModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './manage-inquiry.component.html',
    styleUrl: './manage-inquiry.component.scss'
})
export class ManageInquiryComponent implements OnInit {
    // Tab management
    activeTabIndex: number = 0;
    isEditMode: boolean = false;
    editInquiryId: number | null = null;

    // Form
    inquiryForm!: FormGroup;

    // Data
    inquiries: Inquiry[] = [];
    loading: boolean = false;

    // Dropdown options
    inquirySources: InquirySource[] = [];
    classOptions: ClassOption[] = [];
    counselors: { label: string; value: string }[] = [];

    // Filter fields
    filterName: string = '';
    filterMobile: string = '';
    filterClass: string | null = null;
    filterCounselor: string | null = null;
    filterSource: string | null = null;

    constructor(
        private fb: FormBuilder,
        private inquiryService: InquiryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadDropdownOptions();
        this.loadInquiries();
    }

    private initForm(): void {
        this.inquiryForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
            email: ['', [Validators.required, Validators.email]],
            classInterested: [null, Validators.required],
            address: ['', [Validators.required, Validators.minLength(5)]],
            inquirySource: [null, Validators.required],
            referredBy: [''],
            comments: ['']
        });
    }

    private loadDropdownOptions(): void {
        this.inquirySources = this.inquiryService.getInquirySources();
        this.classOptions = this.inquiryService.getClassOptions();
        this.inquiryService.getCounselors().subscribe({
            next: (counselors) => this.counselors = counselors
        });
    }

    loadInquiries(): void {
        this.loading = true;
        this.inquiryService.getAllInquiries().subscribe({
            next: data => {
                this.inquiries = data;
                this.loading = false;
            },
            error: message => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: message
                });
            }
        });
    }

    onSubmit(): void {
        if (this.inquiryForm.invalid) {
            this.inquiryForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields correctly.'
            });
            return;
        }

        const payload: Inquiry = {
            ...this.inquiryForm.value,
            inquiryId: this.editInquiryId || undefined
        };

        this.inquiryService.saveOrUpdateInquiry(payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.isEditMode ? 'Inquiry Updated' : 'Inquiry Created',
                    detail: 'Inquiry saved successfully.'
                });
                this.resetForm();
                this.loadInquiries();
                this.activeTabIndex = 1;
            },
            error: message => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: message
                });
            }
        });
    }

    onEdit(inquiry: Inquiry): void {
        this.isEditMode = true;
        this.activeTabIndex = 0;
        this.editInquiryId = inquiry.inquiryId || null;

        this.inquiryForm.patchValue(inquiry);
    }

    onDelete(inquiry: Inquiry): void {
        this.confirmationService.confirm({
            message: `Delete inquiry for "${inquiry.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (!inquiry.inquiryId) return;

                this.inquiryService.deleteInquiry(inquiry.inquiryId).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: 'Inquiry deleted successfully.'
                        });
                        this.loadInquiries();
                    },
                    error: message => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                    }
                });
            }
        });
    }



    resetForm(): void {
        this.inquiryForm.reset();
        this.isEditMode = false;
        this.editInquiryId = null;
    }

    cancelEdit(): void {
        this.resetForm();
        this.activeTabIndex = 1;
    }

    clearFilters(): void {
        this.filterName = '';
        this.filterMobile = '';
        this.filterClass = null;
        this.filterCounselor = null;
        this.filterSource = null;
    }

    // Helper methods
    isInvalid(controlName: string): boolean {
        const control = this.inquiryForm.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    getClassLabel(value: string): string {
        const option = this.classOptions.find(c => c.value === value);
        return option?.label || value;
    }

    getSourceLabel(value: string): string {
        const option = this.inquirySources.find(s => s.value === value);
        return option?.label || value;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (status?.toLowerCase()) {
            case 'new': return 'info';
            case 'contacted': return 'success';
            case 'follow-up': return 'warn';
            case 'converted': return 'success';
            case 'closed': return 'danger';
            default: return 'secondary';
        }
    }
}
