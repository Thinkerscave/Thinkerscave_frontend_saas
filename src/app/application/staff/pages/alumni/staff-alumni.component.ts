import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { finalize, forkJoin } from 'rxjs';

import {
  AlumniStaffKpi,
  AlumniStaffRequest,
  AlumniStaffResponse,
  StaffDirectoryCard
} from '../../models/staff-workspace.model';
import { StaffWorkspaceService } from '../../services/staff-workspace.service';

interface KpiTile {
  key: keyof AlumniStaffKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-staff-alumni',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../staff.shared.scss'],
  templateUrl: './staff-alumni.component.html'
})
export class StaffAlumniComponent implements OnInit {
  private readonly api = inject(StaffWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);

  loading = true;
  saving = false;
  errorMessage = '';

  kpi: AlumniStaffKpi = { total: 0, retired: 0, resigned: 0, contractCompleted: 0 };
  list: AlumniStaffResponse[] = [];
  staffOptions: StaffDirectoryCard[] = [];

  searchQuery = '';
  showAdd = false;
  form: AlumniStaffRequest = this.emptyForm();

  readonly kpiTiles: KpiTile[] = [
    { key: 'total',             label: 'Total Alumni Staff', hint: 'All',        tone: 'info' },
    { key: 'retired',           label: 'Retired',            hint: 'Honorable',  tone: 'success' },
    { key: 'resigned',          label: 'Resigned',           hint: 'Recent',     tone: 'warning' },
    { key: 'contractCompleted', label: 'Contract Completed', hint: 'Concluded',  tone: 'neutral' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    forkJoin({
      kpi: this.api.alumniKpi(),
      list: this.api.alumni(),
      staff: this.api.search({})
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, list, staff }) => { this.kpi = kpi; this.list = list; this.staffOptions = staff; },
        error: () => { this.errorMessage = 'Unable to load alumni staff.'; }
      });
  }

  get filtered(): AlumniStaffResponse[] {
    if (!this.searchQuery.trim()) { return this.list; }
    const q = this.searchQuery.toLowerCase();
    return this.list.filter(a =>
      (a.fullName || '').toLowerCase().includes(q) ||
      (a.lastDesignation || '').toLowerCase().includes(q) ||
      (a.department || '').toLowerCase().includes(q) ||
      (a.exitType || '').toLowerCase().includes(q)
    );
  }

  emptyForm(): AlumniStaffRequest {
    return {
      staffId: undefined,
      fullName: '',
      staffCode: '',
      lastDesignation: '',
      department: '',
      exitType: 'RESIGNED',
      exitDate: new Date().toISOString().substring(0, 10),
      joinedDate: undefined,
      email: '',
      contact: '',
      remarks: ''
    };
  }

  openAdd(): void { this.form = this.emptyForm(); this.showAdd = true; }
  closeAdd(): void { this.showAdd = false; }

  save(): void {
    if (!this.form.fullName.trim() || !this.form.exitDate) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Full name and exit date are required.' });
      return;
    }
    this.saving = true;
    this.api.addAlumni(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Alumni staff record added.' });
          this.closeAdd();
          this.load();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Could not add alumni record.' })
      });
  }

  trackById(_: number, a: AlumniStaffResponse): number { return a.alumniStaffId; }
}
