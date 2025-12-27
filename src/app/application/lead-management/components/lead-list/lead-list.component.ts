import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { LeadService } from '../../services/lead.service';
import { LoginService } from '../../../../services/login.service';
import { Lead, FilterOptions } from '../../models/lead.model';
import { LeadStatus, LeadSource } from '../../models/lead-status.enum';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    InputTextModule,
    ToastModule,
    RouterModule
  ],
  templateUrl: './lead-list.component.html',
  styleUrl: './lead-list.component.scss',
  providers: [MessageService]
})
export class LeadListComponent implements OnInit {
  @Input() embedded = false;
  @Output() back = new EventEmitter<void>();

  leads: Lead[] = [];
  filteredLeads: Lead[] = [];
  loading = true;
  counsellorId: string = '';

  // Add Lead Form
  showAddLeadForm = false;
  leadForm!: FormGroup;
  savingLead = false;
  cities: string[] = [];
  sourceOptions = Object.values(LeadSource).map(s => ({ label: s.replace(/_/g, ' '), value: s }));

  // Filter options
  selectedStatus: string | null = null;
  selectedCourse: string | null = null;
  searchTerm: string = '';
  courses: string[] = [];
  statuses = Object.values(LeadStatus);

  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'New', value: LeadStatus.NEW },
    { label: 'Contacted', value: LeadStatus.CONTACTED },
    { label: 'Interested', value: LeadStatus.INTERESTED },
    { label: 'Follow-up', value: LeadStatus.FOLLOW_UP },
    { label: 'Admission Confirmed', value: LeadStatus.ADMISSION_CONFIRMED },
    { label: 'Lost', value: LeadStatus.LOST }
  ];

  constructor(
    private leadService: LeadService,
    private loginService: LoginService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.counsellorId = this.loginService.getUser()?.id || 'C001';
    this.loadCourses();
    this.loadCities();
    this.loadLeads();
    this.initLeadForm();

    // Check for filter query params
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'];
        this.applyFilters();
      }
    });
  }

  initLeadForm(): void {
    this.leadForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.email]],
      city: ['', Validators.required],
      course: ['', Validators.required],
      source: [LeadSource.WALK_IN, Validators.required],
      notes: ['']
    });
  }

  toggleAddLead(): void {
    this.showAddLeadForm = !this.showAddLeadForm;
    if (this.showAddLeadForm) {
      this.initLeadForm();
    }
  }

  cancelAddLead(): void {
    this.showAddLeadForm = false;
    this.leadForm.reset();
  }

  saveLead(): void {
    if (this.leadForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields correctly',
        life: 3000
      });
      return;
    }

    this.savingLead = true;
    const formValue = this.leadForm.value;

    // Use 'any' type to bypass temporary type mismatch with Omit<Lead, ...>
    // In a real app, strict typing should be ensured
    const newLead: any = {
      name: formValue.name,
      phoneNumber: formValue.phoneNumber,
      email: formValue.email || '',
      city: formValue.city,
      course: formValue.course,
      source: formValue.source,
      status: LeadStatus.NEW,
      assignedCounsellor: this.counsellorId,
      // counsellorName: this.configService.getUser()?.name, // Optional if backend handles it
      nextFollowUpDate: new Date(new Date().setDate(new Date().getDate() + 2)), // Default follow up in 2 days
      notes: formValue.notes
    };

    this.leadService.createLead(newLead).subscribe({
      next: (lead) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lead created successfully',
          life: 3000
        });
        this.savingLead = false;
        this.showAddLeadForm = false;
        this.leadForm.reset();
        this.loadLeads(); // Refresh list
      },
      error: (err) => {
        console.error('Error creating lead', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create lead',
          life: 3000
        });
        this.savingLead = false;
      }
    });
  }

  loadLeads(): void {
    this.loading = true;
    const filters: FilterOptions = {
      status: this.selectedStatus as LeadStatus || undefined,
      course: this.selectedCourse || undefined,
      searchTerm: this.searchTerm || undefined
    };

    this.leadService.getLeadsForCounsellor(this.counsellorId, filters).subscribe({
      next: (leads: Lead[]) => {
        this.leads = leads;
        this.filteredLeads = leads;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading leads', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load leads',
          life: 3000
        });
        this.loading = false;
      }
    });
  }

  loadCourses(): void {
    this.leadService.getCourses().subscribe({
      next: (courses: string[]) => {
        this.courses = courses;
      },
      error: (err: any) => {
        console.error('Error loading courses', err);
      }
    });
  }

  loadCities(): void {
    this.leadService.getCities().subscribe({
      next: (cities: string[]) => {
        this.cities = cities;
      },
      error: (err: any) => {
        console.error('Error loading cities', err);
      }
    });
  }

  applyFilters(): void {
    this.filteredLeads = this.leads.filter(lead => {
      let match = true;

      if (this.selectedStatus && lead.status !== this.selectedStatus) {
        match = false;
      }

      if (this.selectedCourse && lead.course !== this.selectedCourse) {
        match = false;
      }

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        const matches = lead.name.toLowerCase().includes(term) ||
          lead.phoneNumber.includes(term) ||
          lead.email.toLowerCase().includes(term);
        if (!matches) match = false;
      }

      return match;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getSeverity(status: string): string {
    switch (status) {
      case 'NEW':
        return 'info';
      case 'CONTACTED':
        return 'warning';
      case 'INTERESTED':
        return 'success';
      case 'FOLLOW_UP':
        return 'warning';
      case 'ADMISSION_CONFIRMED':
        return 'success';
      case 'LOST':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Navigate back to counsellor dashboard
   */
  goBack(): void {
    this.router.navigate(['/app/counsellor-dashboard']);
  }
}
