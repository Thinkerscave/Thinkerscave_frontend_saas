import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { DocumentVaultEntry, StudentDirectoryCard, TransferRequest, TransferStatus } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

interface KpiTile {
  label: string;
  count: number;
  status: TransferStatus | 'ALL';
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  icon: string;
}

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
  showNewTransferDrawer = false;
  errorMessage = '';
  successMessage = '';

  transfers: TransferRequest[] = [];
  students: StudentDirectoryCard[] = [];
  documents: DocumentVaultEntry[] = [];
  
  // Filtering
  filterStatus: TransferStatus | 'ALL' = 'ALL';

  // New transfer request form
  newRequest: TransferRequest = {};

  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading = true;
    forkJoin({
      transfers: this.api.listTransfers(),
      students: this.api.search({ status: 'ACTIVE' }, 0, 200)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ transfers, students }) => {
          this.transfers = transfers ?? [];
          this.students = students.content ?? [];
          this.errorMessage = '';
        },
        error: () => { this.errorMessage = 'Could not load transfer requests.'; }
      });
  }

  get filteredTransfers(): TransferRequest[] {
    if (this.filterStatus === 'ALL') return this.transfers;
    return this.transfers.filter(t => t.status === this.filterStatus);
  }

  get kpiTiles(): KpiTile[] {
    return [
      { label: 'All Requests', count: this.transfers.length, status: 'ALL', tone: 'info', icon: 'pi-list' },
      { label: 'Requested', count: this.transfers.filter(t => t.status === 'REQUESTED').length, status: 'REQUESTED', tone: 'warning', icon: 'pi-clock' },
      { label: 'Approved', count: this.transfers.filter(t => t.status === 'APPROVED').length, status: 'APPROVED', tone: 'success', icon: 'pi-check-circle' },
      { label: 'Certificate Issued', count: this.transfers.filter(t => t.status === 'CERTIFICATE_ISSUED').length, status: 'CERTIFICATE_ISSUED', tone: 'info', icon: 'pi pi-flag' },
      { label: 'Rejected', count: this.transfers.filter(t => t.status === 'REJECTED').length, status: 'REJECTED', tone: 'danger', icon: 'pi-times-circle' }
    ];
  }

  setFilter(status: TransferStatus | 'ALL'): void {
    this.filterStatus = status;
  }

  openNewTransfer(): void {
    this.newRequest = { requestedOn: new Date().toISOString().substring(0, 10), status: 'REQUESTED' };
    this.showNewTransferDrawer = true;
  }

  closeNewTransfer(): void { this.showNewTransferDrawer = false; }

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
          this.showNewTransferDrawer = false;
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

  approve(req: TransferRequest, event: Event): void {
    event.stopPropagation();
    this.transition(req, 'APPROVED');
  }

  reject(req: TransferRequest, event: Event): void {
    event.stopPropagation();
    this.transition(req, 'REJECTED');
  }

  complete(req: TransferRequest, event: Event): void {
    event.stopPropagation();
    this.transition(req, 'CERTIFICATE_ISSUED');
  }

  onStudentChanged(): void {
    const student = this.students.find(s => s.studentId === Number(this.newRequest.studentId));
    this.newRequest.studentName = student?.fullName;
    this.newRequest.className = student?.className;
    this.newRequest.sectionName = student?.sectionName;
    if (student?.studentId) {
      this.api.getActiveEnrollment(student.studentId).subscribe({
        next: en => { this.newRequest.enrollmentId = en.enrollmentId; this.cdr.markForCheck(); },
        error: () => { this.newRequest.enrollmentId = undefined; }
      });
    }
  }

  statusTone(s?: TransferStatus | null): string {
    switch (s) {
      case 'COMPLETED': case 'APPROVED': return 'success';
      case 'UNDER_REVIEW': case 'REQUESTED': return 'warning';
      case 'REJECTED': case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  }

  exportTransfers(): void {
    alert('Export triggered. File will be downloaded shortly.');
  }
}
