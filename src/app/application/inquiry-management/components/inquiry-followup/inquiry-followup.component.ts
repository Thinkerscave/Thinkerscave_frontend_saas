import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, MenuItem } from 'primeng/api';

// Services & Models
import { FollowUpService } from '../../services/followup.service';
import { InquiryWithFollowUp, FollowUpStatus } from '../../models/followup.model';
import { InquiryService } from '../../services/inquiry.service';

type TabType = 'today' | 'overdue' | 'upcoming' | 'converted' | 'lost';

@Component({
    selector: 'app-inquiry-followup',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        TableModule,
        InputTextModule,
        DropdownModule,
        ToastModule,
        TooltipModule,
        TagModule,
        AvatarModule,
        MenuModule,
        IconFieldModule,
        InputIconModule,
        DatePickerModule
    ],
    providers: [MessageService],
    templateUrl: './inquiry-followup.component.html',
    styleUrl: './inquiry-followup.component.scss'
})
export class InquiryFollowupComponent implements OnInit {
    // Tab management
    activeTab: TabType = 'today';
    tabCounts: { [key: string]: number } = {
        today: 0,
        overdue: 0,
        upcoming: 0,
        converted: 0,
        lost: 0
    };

    // Data
    inquiries: InquiryWithFollowUp[] = [];
    filteredInquiries: InquiryWithFollowUp[] = [];
    loading: boolean = false;

    // Filters
    private _searchText: string = '';
    private _selectedCounselor: string | null = null;
    private _selectedDate: Date | null = null;

    get searchText(): string { return this._searchText; }
    set searchText(value: string) {
        this._searchText = value;
        this.applyFilters();
    }

    get selectedCounselor(): string | null { return this._selectedCounselor; }
    set selectedCounselor(value: string | null) {
        this._selectedCounselor = value;
        this.applyFilters();
    }

    get selectedDate(): Date | null { return this._selectedDate; }
    set selectedDate(value: Date | null) {
        this._selectedDate = value;
        this.applyFilters();
    }

    // Dropdown options
    counselors: { label: string; value: string }[] = [];
    classOptions: { label: string; value: string }[] = [];
    statuses: FollowUpStatus[] = [];

    // More menu
    moreMenuItems: MenuItem[] = [];

    constructor(
        private followUpService: FollowUpService,
        private inquiryService: InquiryService,
        private messageService: MessageService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadDropdownOptions();
        this.loadTabCounts();
        this.loadInquiries();
        this.initMoreMenu();
    }

    private loadDropdownOptions(): void {
        this.followUpService.getCounselors().subscribe({
            next: (data) => this.counselors = data
        });
        this.classOptions = this.inquiryService.getClassOptions();
        this.statuses = this.followUpService.getFollowUpStatuses();
    }

    private loadTabCounts(): void {
        this.followUpService.getTabCounts().subscribe({
            next: (counts) => this.tabCounts = counts
        });
    }

    loadInquiries(): void {
        this.loading = true;
        this.followUpService.getInquiriesByTab(this.activeTab).subscribe({
            next: (data) => {
                this.inquiries = data;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load inquiries.'
                });
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.inquiries];

        // Search filter - search across name, mobile, email
        if (this._searchText && this._searchText.trim()) {
            const search = this._searchText.toLowerCase().trim();
            filtered = filtered.filter(i =>
                i.name.toLowerCase().includes(search) ||
                i.mobileNumber.includes(search) ||
                i.email.toLowerCase().includes(search)
            );
        }

        // Counselor filter
        if (this._selectedCounselor) {
            const counselorName = this.counselors.find(c => c.value === this._selectedCounselor)?.label;
            if (counselorName) {
                filtered = filtered.filter(i => i.assignedCounselor === counselorName);
            }
        }

        // Date filter - filter by next follow-up date
        if (this._selectedDate) {
            const selectedDateStr = this._selectedDate.toDateString();
            filtered = filtered.filter(i => {
                if (!i.nextFollowUpDate) return false;
                return new Date(i.nextFollowUpDate).toDateString() === selectedDateStr;
            });
        }

        this.filteredInquiries = filtered;
    }

    private initMoreMenu(): void {
        this.moreMenuItems = [
            {
                label: 'Export to Excel',
                icon: 'pi pi-file-excel',
                command: () => this.exportToExcel()
            },
            {
                label: 'Print',
                icon: 'pi pi-print',
                command: () => this.print()
            },
            { separator: true },
            {
                label: 'Settings',
                icon: 'pi pi-cog'
            }
        ];
    }

    onTabChange(tab: TabType): void {
        this.activeTab = tab;
        this.loadInquiries();
    }

    onView(inquiry: InquiryWithFollowUp): void {
        this.router.navigate(['/app/inquiry/detail', inquiry.inquiryId]);
    }

    onUpdate(inquiry: InquiryWithFollowUp): void {
        this.router.navigate(['/app/inquiry/detail', inquiry.inquiryId], {
            queryParams: { action: 'update' }
        });
    }

    onProceedToAdmission(inquiry: InquiryWithFollowUp): void {
        // Navigate to admission form with inquiry data
        this.messageService.add({
            severity: 'info',
            summary: 'Proceed to Admission',
            detail: `Starting admission process for ${inquiry.name}`
        });
        // TODO: Implement admission navigation
    }

    clearFilters(): void {
        this.searchText = '';
        this.selectedCounselor = null;
        this.selectedDate = null;
    }

    refresh(): void {
        this.loadTabCounts();
        this.loadInquiries();
        this.messageService.add({
            severity: 'success',
            summary: 'Refreshed',
            detail: 'Data has been refreshed.'
        });
    }

    private exportToExcel(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Export',
            detail: 'Exporting to Excel...'
        });
    }

    private print(): void {
        window.print();
    }

    // Helper methods
    getClassLabel(value: string): string {
        const option = this.classOptions.find(c => c.value === value);
        return option?.label || value;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const statusObj = this.statuses.find(s => s.value === status);
        return statusObj?.severity || 'secondary';
    }

    getDaysText(days: number | undefined): string {
        if (days === undefined) return '-';
        if (days === 0) return 'Today';
        if (days < 0) return `${Math.abs(days)} Days`;
        return `${days} Days`;
    }

    getDaysSeverity(days: number | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (days === undefined) return 'secondary';
        if (days < 0) return 'danger';
        if (days === 0) return 'info';
        if (days <= 3) return 'warn';
        return 'success';
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    getAvatarColor(name: string): string {
        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    getFollowUpTypeSeverity(type: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (!type) return 'secondary';
        switch (type.toLowerCase()) {
            case 'call': return 'info';
            case 'whatsapp': return 'success';
            case 'email': return 'warn';
            case 'sms': return 'contrast';
            case 'meeting': return 'info';
            case 'walk-in': return 'secondary';
            default: return 'secondary';
        }
    }
}
