import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

import { LeadService } from '../../services/lead.service';
import { Lead, LeadInteraction } from '../../models/lead.model';
import { LeadStatus, LostLeadReason } from '../../models/lead-status.enum';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    TagModule,
    DropdownModule,
    DividerModule,
    TooltipModule
  ],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.scss',
  providers: [MessageService]
})
export class LeadDetailComponent implements OnInit {
  lead: Lead | null = null;
  interactions: LeadInteraction[] = [];
  loading = true;
  leadId: string = '';

  // Status update
  selectedStatus: LeadStatus | null = null;
  selectedLostReason: LostLeadReason | null = null;
  statuses = Object.values(LeadStatus);
  lostReasons = Object.values(LostLeadReason);

  // New interaction
  interactionNotes: string = '';
  showInteractionForm = false;

  statusOptions = [
    { label: 'New', value: LeadStatus.NEW },
    { label: 'Contacted', value: LeadStatus.CONTACTED },
    { label: 'Interested', value: LeadStatus.INTERESTED },
    { label: 'Follow-up', value: LeadStatus.FOLLOW_UP },
    { label: 'Admission Confirmed', value: LeadStatus.ADMISSION_CONFIRMED },
    { label: 'Lost', value: LeadStatus.LOST }
  ];

  lostReasonOptions = [
    { label: 'Fee too high', value: LostLeadReason.FEE_TOO_HIGH },
    { label: 'Joined another institute', value: LostLeadReason.JOINED_ANOTHER_INSTITUTE },
    { label: 'Not eligible', value: LostLeadReason.NOT_ELIGIBLE },
    { label: 'No response', value: LostLeadReason.NO_RESPONSE },
    { label: 'Not interested', value: LostLeadReason.NOT_INTERESTED }
  ];

  constructor(
    private leadService: LeadService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.leadId = params['id'];
      this.loadLeadDetails();
      this.loadInteractions();
    });
  }

  loadLeadDetails(): void {
    this.leadService.getLeadById(this.leadId).subscribe({
      next: (lead) => {
        this.lead = lead || null;
        this.selectedStatus = lead?.status || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lead', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load lead details',
          life: 3000
        });
        this.loading = false;
      }
    });
  }

  loadInteractions(): void {
    this.leadService.getLeadInteractions(this.leadId).subscribe({
      next: (interactions) => {
        this.interactions = interactions.sort((a, b) =>
          new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime()
        );
      },
      error: (err) => {
        console.error('Error loading interactions', err);
      }
    });
  }

  updateStatus(): void {
    if (!this.lead || !this.selectedStatus) return;

    let lostReason = undefined;
    if (this.selectedStatus === LeadStatus.LOST && !this.selectedLostReason) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a reason for marking as lost',
        life: 3000
      });
      return;
    }

    if (this.selectedStatus === LeadStatus.LOST) {
      lostReason = this.selectedLostReason || undefined;
    }

    this.leadService.updateLeadStatus(this.leadId, this.selectedStatus, lostReason).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lead status updated successfully',
          life: 3000
        });
        this.loadLeadDetails();
      },
      error: (err) => {
        console.error('Error updating lead', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update lead status',
          life: 3000
        });
      }
    });
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Navigate back to manage leads page
   */
  goBack(): void {
    this.router.navigate(['/app/manage-leads']);
  }
}
