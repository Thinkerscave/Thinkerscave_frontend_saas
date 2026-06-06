import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { TransferRequest, TransferStatus } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

@Component({
  selector: 'app-student-movement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './student-movement.component.html'
})
export class StudentMovementComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  saving = false;
  showForm = false;
  errorMessage = '';
  successMessage = '';

  transfers: TransferRequest[] = [];
  selected?: TransferRequest;

  newRequest: TransferRequest = {};

  readonly readinessChecks = [
    { label: 'Fees Cleared',        ok: true },
    { label: 'Library Books Returned', ok: true },
    { label: 'All Documents on file',  ok: false },
    { label: 'Transport No Dues',      ok: true }
  ];

  readonly statuses: TransferStatus[] = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'TC_ISSUED', 'REJECTED', 'CANCELLED'];

  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading = true;
    this.api.listTransfers()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => { this.transfers = list ?? []; },
        error: () => { this.errorMessage = 'Could not load transfer requests.'; }
      });
  }

  openNew(): void {
    this.newRequest = { requestedOn: new Date().toISOString().substring(0, 10) };
    this.showForm = true;
  }

  closeNew(): void { this.showForm = false; }

  submitRequest(): void {
    if (!this.newRequest.studentId || !this.newRequest.reason) {
      this.errorMessage = 'Student and reason are required.';
      return;
    }
    this.saving = true;
    this.api.createTransfer(this.newRequest)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          this.transfers = [created, ...this.transfers];
          this.successMessage = 'Transfer request created.';
          this.showForm = false;
          this.newRequest = {};
        },
        error: () => { this.errorMessage = 'Could not create transfer request.'; }
      });
  }

  transition(req: TransferRequest, target: TransferStatus): void {
    if (!req.id) return;
    this.api.transitionTransfer(req.id, target).subscribe({
      next: updated => { Object.assign(req, updated); this.cdr.markForCheck(); },
      error: () => { this.errorMessage = `Could not move request to ${target}.`; }
    });
  }

  select(req: TransferRequest): void { this.selected = req; }

  statusTone(s?: TransferStatus | null): string {
    switch (s) {
      case 'APPROVED': case 'TC_ISSUED': return 'success';
      case 'UNDER_REVIEW': case 'REQUESTED': return 'info';
      case 'REJECTED': case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  }
}
