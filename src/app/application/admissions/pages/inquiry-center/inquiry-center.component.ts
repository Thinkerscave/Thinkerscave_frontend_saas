import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  CanonicalInquiryStatus,
  InquiryKpi,
  InquiryQuickActions,
  InquiryRecord,
  InquirySearchRequest
} from '../../models/admissions-workspace.model';
import { AdmissionsWorkspaceService } from '../../services/admissions-workspace.service';

interface KpiTile {
  key: keyof InquiryKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  filter?: Partial<InquirySearchRequest>;
}

interface QuickTile {
  key: keyof InquiryQuickActions;
  label: string;
  hint: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-inquiry-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './inquiry-center.component.html'
})
export class InquiryCenterComponent implements OnInit {
  private readonly api = inject(AdmissionsWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  searching = false;
  errorMessage = '';
  successMessage = '';

  kpi: InquiryKpi = {
    newInquiries: 0,
    todaysFollowUps: 0,
    interested: 0,
    admissionReady: 0,
    futureProspects: 0,
    closed: 0
  };
  quick: InquiryQuickActions = {
    todaysCalls: 0,
    todaysMeetings: 0,
    overdueFollowUps: 0,
    admissionReady: 0
  };
  inquiries: InquiryRecord[] = [];

  filter: InquirySearchRequest = {};
  activeKpi: keyof InquiryKpi | null = null;

  readonly kpiTiles: KpiTile[] = [
    { key: 'newInquiries',    label: 'New Inquiries',   hint: 'Awaiting first contact',     tone: 'info',    filter: { status: 'NEW' } },
    { key: 'todaysFollowUps', label: "Today's Follow-Ups", hint: 'Scheduled for today',     tone: 'warning' },
    { key: 'interested',      label: 'Interested',      hint: 'Ready for counseling',       tone: 'success', filter: { status: 'INTERESTED' } },
    { key: 'admissionReady',  label: 'Admission Ready', hint: 'Documents collected',         tone: 'success', filter: { status: 'READY_FOR_ADMISSION' } },
    { key: 'futureProspects', label: 'Future Prospects',hint: 'Long-term opportunities',     tone: 'neutral' },
    { key: 'closed',          label: 'Closed',           hint: 'Lost or converted',          tone: 'neutral', filter: { status: 'CLOSED' } }
  ];

  readonly quickTiles: QuickTile[] = [
    { key: 'todaysCalls',     label: "Today's Calls",     hint: 'Telephonic follow-ups',  icon: 'pi pi-phone',    tone: 'info' },
    { key: 'todaysMeetings',  label: "Today's Meetings",  hint: 'Walk-ins & demos',        icon: 'pi pi-calendar', tone: 'info' },
    { key: 'overdueFollowUps',label: 'Overdue Follow-Ups',hint: 'Need attention now',      icon: 'pi pi-exclamation-triangle', tone: 'danger' },
    { key: 'admissionReady',  label: 'Admission Ready',   hint: 'Promote to admission',    icon: 'pi pi-check-circle', tone: 'success' }
  ];

  readonly statusOptions: CanonicalInquiryStatus[] = [
    'NEW', 'CONTACTED', 'INTERESTED', 'COUNSELING', 'DOCUMENTS_PENDING',
    'FOLLOW_UP_REQUIRED', 'READY_FOR_ADMISSION', 'CONVERTED', 'LOST', 'CLOSED'
  ];
  readonly sourceOptions = ['WEBSITE', 'WALK_IN', 'REFERRAL', 'PHONE_CALL', 'SOCIAL_MEDIA', 'CAMPAIGN'];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      kpi:   this.api.inquiryKpi(),
      quick: this.api.inquiryQuickActions(),
      list:  this.api.searchInquiries(this.filter)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, quick, list }) => {
          this.kpi = kpi;
          this.quick = quick;
          this.inquiries = list;
        },
        error: () => { this.errorMessage = 'Unable to load inquiries. Please retry.'; }
      });
  }

  runSearch(): void {
    this.searching = true;
    this.api.searchInquiries(this.filter)
      .pipe(finalize(() => { this.searching = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => { this.inquiries = list; this.errorMessage = ''; },
        error: () => { this.errorMessage = 'Search failed. Please retry.'; }
      });
  }

  toggleKpiFilter(tile: KpiTile): void {
    if (this.activeKpi === tile.key) {
      this.activeKpi = null;
      this.filter = {};
    } else {
      this.activeKpi = tile.key;
      this.filter = { ...this.filter, ...(tile.filter ?? {}) };
    }
    this.runSearch();
  }

  clearFilters(): void {
    this.filter = {};
    this.activeKpi = null;
    this.runSearch();
  }

  openInquiry(record: InquiryRecord): void {
    this.router.navigate(['/app/admissions/detail', record.inquiryId]);
  }

  callPhone(record: InquiryRecord, event: Event): void {
    event.stopPropagation();
    if (record.mobileNumber) window.open(`tel:${record.mobileNumber}`, '_self');
  }
  whatsapp(record: InquiryRecord, event: Event): void {
    event.stopPropagation();
    if (record.mobileNumber) window.open(`https://wa.me/${record.mobileNumber.replace(/\D/g, '')}`, '_blank');
  }
  emailContact(record: InquiryRecord, event: Event): void {
    event.stopPropagation();
    if (record.email) window.open(`mailto:${record.email}`, '_self');
  }
  openMap(record: InquiryRecord, event: Event): void {
    event.stopPropagation();
    if (record.address) window.open(`https://maps.google.com/?q=${encodeURIComponent(record.address)}`, '_blank');
  }

  newInquiry(): void {
    // Reuse existing inquiry create flow
    this.router.navigate(['/app/inquiry/inquiries/add']);
  }

  totalCount(): number {
    return this.kpi.newInquiries + this.kpi.interested + this.kpi.admissionReady + this.kpi.futureProspects + this.kpi.closed;
  }

  statusTone(status: CanonicalInquiryStatus): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'NEW': case 'CONTACTED': return 'info';
      case 'INTERESTED': case 'COUNSELING': case 'READY_FOR_ADMISSION': case 'CONVERTED': return 'success';
      case 'FOLLOW_UP_REQUIRED': case 'DOCUMENTS_PENDING': return 'warning';
      case 'LOST': case 'CLOSED': return 'danger';
      default: return 'neutral';
    }
  }
}
