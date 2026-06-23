import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Responsibility,
  ResponsibilityRequest
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';

@Component({
  selector: 'app-staff-responsibilities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-responsibilities.component.html'
})
export class StaffResponsibilitiesComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  errorMessage = '';

  list: Responsibility[] = [];

  get activeCount(): number { return this.list.filter(r => r.active).length; }
  get inactiveCount(): number { return this.list.filter(r => !r.active).length; }
  get customCount(): number { return this.list.filter(r => !r.systemDefined).length; }

  showModal = false;
  editingId: number | null = null;
  form: ResponsibilityRequest = this.emptyForm();
  searchQuery = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getResponsibilities()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => { this.list = list; },
        error: () => { this.errorMessage = 'Unable to load responsibilities.'; }
      });
  }

  get filtered(): Responsibility[] {
    if (!this.searchQuery.trim()) { return this.list; }
    const q = this.searchQuery.toLowerCase();
    return this.list.filter(r =>
      (r.responsibilityName || '').toLowerCase().includes(q) ||
      (r.responsibilityCode || '').toLowerCase().includes(q)
    );
  }

  emptyForm(): ResponsibilityRequest {
    return {
      responsibilityCode: '',
      responsibilityName: '',
      description: '',
      displayOrder: 0,
      remarks: ''
    };
  }

  openAdd(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEdit(r: Responsibility): void {
    this.editingId = r.responsibilityId;
    this.form = {
      responsibilityCode: r.responsibilityCode,
      responsibilityName: r.responsibilityName,
      description: r.description ?? '',
      displayOrder: r.displayOrder ?? 0,
      remarks: r.remarks ?? ''
    };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.editingId = null; }

  save(): void {
    if (!this.form.responsibilityName.trim() || !this.form.responsibilityCode.trim()) {
      return;
    }
    this.saving = true;
    const obs = this.editingId
      ? this.api.updateResponsibility(this.editingId, this.form)
      : this.api.createResponsibility(this.form);

    obs.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
        }
      });
  }

  toggleActive(r: Responsibility): void {
    const obs = r.active
      ? this.api.deactivateResponsibility(r.responsibilityId)
      : this.api.activateResponsibility(r.responsibilityId);
    
    obs.subscribe({
      next: () => {
        r.active = !r.active;
        this.cdr.markForCheck();
      }
    });
  }

  trackById(_: number, r: Responsibility): number { return r.responsibilityId; }
}
