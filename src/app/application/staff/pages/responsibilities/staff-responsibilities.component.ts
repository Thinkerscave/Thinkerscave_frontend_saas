import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { finalize, forkJoin } from 'rxjs';

import {
  ResponsibilityKpi,
  ResponsibilityRequest,
  ResponsibilityResponse,
  StaffDirectoryCard
} from '../../models/staff-workspace.model';
import { StaffWorkspaceService } from '../../services/staff-workspace.service';

interface KpiTile {
  key: keyof ResponsibilityKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-staff-responsibilities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../staff.shared.scss'],
  templateUrl: './staff-responsibilities.component.html'
})
export class StaffResponsibilitiesComponent implements OnInit {
  private readonly api = inject(StaffWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  loading = true;
  saving = false;
  errorMessage = '';

  kpi: ResponsibilityKpi = { total: 0, assigned: 0, unassigned: 0, custom: 0 };
  list: ResponsibilityResponse[] = [];
  staffOptions: StaffDirectoryCard[] = [];

  readonly kpiTiles: KpiTile[] = [
    { key: 'total',      label: 'Total Responsibilities', hint: 'All',     tone: 'info' },
    { key: 'assigned',   label: 'Assigned',               hint: 'Today',   tone: 'success' },
    { key: 'unassigned', label: 'Unassigned',             hint: 'Today',   tone: 'warning' },
    { key: 'custom',     label: 'Custom Responsibilities',hint: 'Created', tone: 'neutral' }
  ];

  showModal = false;
  editingId: number | null = null;
  form: ResponsibilityRequest = this.emptyForm();
  searchQuery = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    forkJoin({
      kpi: this.api.responsibilityKpi(),
      list: this.api.listResponsibilities(),
      staff: this.api.search({})
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, list, staff }) => { this.kpi = kpi; this.list = list; this.staffOptions = staff; },
        error: () => { this.errorMessage = 'Unable to load responsibilities.'; }
      });
  }

  get filtered(): ResponsibilityResponse[] {
    if (!this.searchQuery.trim()) { return this.list; }
    const q = this.searchQuery.toLowerCase();
    return this.list.filter(r =>
      (r.responsibilityName || '').toLowerCase().includes(q) ||
      (r.staffName || '').toLowerCase().includes(q) ||
      (r.responsibilityType || '').toLowerCase().includes(q)
    );
  }

  emptyForm(): ResponsibilityRequest {
    return {
      staffId: undefined,
      responsibilityName: '',
      responsibilityType: 'COORDINATOR',
      scope: '',
      effectiveFrom: new Date().toISOString().substring(0, 10),
      effectiveTo: undefined,
      status: 'ASSIGNED',
      remarks: ''
    };
  }

  openAdd(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEdit(r: ResponsibilityResponse): void {
    this.editingId = r.responsibilityId;
    this.form = {
      staffId: r.staffId,
      responsibilityName: r.responsibilityName,
      responsibilityType: r.responsibilityType,
      scope: r.scope,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo,
      status: r.status,
      remarks: r.remarks
    };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.editingId = null; }

  save(): void {
    if (!this.form.responsibilityName.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Responsibility name is required.' });
      return;
    }
    this.saving = true;
    const obs = this.editingId
      ? this.api.updateResponsibility(this.editingId, this.form)
      : this.api.addResponsibility(this.form);

    obs.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Responsibility saved.' });
          this.closeModal();
          this.load();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Could not save responsibility.' })
      });
  }

  confirmDelete(r: ResponsibilityResponse): void {
    this.confirmationService.confirm({
      message: `Delete "${r.responsibilityName}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteResponsibility(r.responsibilityId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Responsibility removed.' });
            this.load();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Delete failed.' })
        });
      }
    });
  }

  trackById(_: number, r: ResponsibilityResponse): number { return r.responsibilityId; }
}
