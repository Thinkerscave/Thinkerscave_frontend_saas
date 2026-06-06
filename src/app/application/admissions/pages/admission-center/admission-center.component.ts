import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  AdmissionKpi,
  AdmissionRecord,
  AdmissionSearchRequest,
  ApplicationStatusCode
} from '../../models/admissions-workspace.model';
import { AdmissionsWorkspaceService } from '../../services/admissions-workspace.service';

interface AdmKpiTile {
  key: keyof AdmissionKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  filter?: Partial<AdmissionSearchRequest>;
}

@Component({
  selector: 'app-admission-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './admission-center.component.html'
})
export class AdmissionCenterComponent implements OnInit {
  private readonly api = inject(AdmissionsWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  searching = false;
  errorMessage = '';

  kpi: AdmissionKpi = { inProgress: 0, documentsPending: 0, verificationPending: 0, readyToEnroll: 0, completed: 0 };
  records: AdmissionRecord[] = [];

  filter: AdmissionSearchRequest = {};
  activeKpi: keyof AdmissionKpi | null = null;

  readonly tiles: AdmKpiTile[] = [
    { key: 'inProgress',          label: 'In Progress',          hint: 'Draft / pending',           tone: 'info',    filter: { status: 'PENDING' } },
    { key: 'documentsPending',    label: 'Documents Pending',    hint: 'Awaiting paperwork',        tone: 'warning' },
    { key: 'verificationPending', label: 'Verification Pending', hint: 'Awaiting officer review',   tone: 'warning', filter: { status: 'UNDER_REVIEW' } },
    { key: 'readyToEnroll',       label: 'Ready To Enroll',      hint: 'All docs verified',         tone: 'success' },
    { key: 'completed',           label: 'Completed',            hint: 'Enrolled & student created', tone: 'success', filter: { status: 'APPROVED' } }
  ];

  readonly statusOptions: ApplicationStatusCode[] = ['DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      kpi:  this.api.admissionKpi(),
      list: this.api.searchAdmissions(this.filter)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, list }) => { this.kpi = kpi; this.records = list; },
        error: () => this.errorMessage = 'Unable to load admissions.'
      });
  }

  runSearch(): void {
    this.searching = true;
    this.api.searchAdmissions(this.filter)
      .pipe(finalize(() => { this.searching = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => { this.records = list; this.errorMessage = ''; },
        error: () => this.errorMessage = 'Search failed.'
      });
  }

  toggleKpiFilter(tile: AdmKpiTile): void {
    if (this.activeKpi === tile.key) {
      this.activeKpi = null;
      this.filter = {};
    } else {
      this.activeKpi = tile.key;
      this.filter = { ...this.filter, ...(tile.filter ?? {}) };
    }
    this.runSearch();
  }

  clearFilters(): void { this.filter = {}; this.activeKpi = null; this.runSearch(); }

  openWizard(record: AdmissionRecord): void {
    this.router.navigate(['/app/admissions/wizard', record.applicationId]);
  }

  newAdmission(): void {
    this.router.navigate(['/app/admissions/wizard/new']);
  }

  statusTone(status?: ApplicationStatusCode | null): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'DRAFT': case 'PENDING': return 'info';
      case 'UNDER_REVIEW': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  }

  docCount(r: AdmissionRecord): number { return r.uploadedDocuments?.length ?? 0; }
}
