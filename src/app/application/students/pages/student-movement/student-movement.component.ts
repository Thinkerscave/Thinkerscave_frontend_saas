import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { DocumentVaultEntry, StudentDirectoryCard, TransferRequest, TransferStatus } from '../../models/students-workspace.model';
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
  students: StudentDirectoryCard[] = [];
  documents: DocumentVaultEntry[] = [];
  selected?: TransferRequest;

  newRequest: TransferRequest = {};

  readonly statuses: TransferStatus[] = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'CERTIFICATE_ISSUED', 'REJECTED', 'CANCELLED'];

  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading = true;
    forkJoin({
      transfers: this.api.listTransfers(),
      students: this.api.search({ status: 'ACTIVE' }),
      documents: this.api.documents()
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ transfers, students, documents }) => {
          this.transfers = transfers ?? [];
          this.students = students ?? [];
          this.documents = documents ?? [];
        },
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

  onStudentChanged(): void {
    const student = this.students.find(s => s.studentId === Number(this.newRequest.studentId));
    this.newRequest.enrollmentId = student?.activeEnrollmentId ?? undefined;
  }

  studentName(studentId?: number | null): string {
    return this.students.find(s => s.studentId === studentId)?.fullName ?? (studentId ? `Student #${studentId}` : '-');
  }

  selectedStudent(): StudentDirectoryCard | undefined {
    return this.selected ? this.students.find(s => s.studentId === this.selected?.studentId) : undefined;
  }

  readinessChecks(): Array<{ label: string; ok: boolean; helper: string }> {
    const studentId = this.selected?.studentId;
    const docs = studentId ? this.documents.filter(d => d.studentId === studentId) : [];
    const hasPersonal = docs.some(d => d.category === 'PERSONAL' && d.status === 'VERIFIED');
    const hasAcademic = docs.some(d => d.category === 'ACADEMIC' && d.status === 'VERIFIED');
    return [
      { label: 'Fee Clearance', ok: true, helper: 'No dues flagged' },
      { label: 'Library Clearance', ok: true, helper: 'No books pending' },
      { label: 'Personal Documents', ok: hasPersonal, helper: hasPersonal ? 'Verified' : 'Needs verification' },
      { label: 'Academic Documents', ok: hasAcademic, helper: hasAcademic ? 'Verified' : 'Needs verification' }
    ];
  }

  issueCertificate(): void {
    if (!this.selected) return;
    this.transition(this.selected, 'CERTIFICATE_ISSUED');
  }

  statusTone(s?: TransferStatus | null): string {
    switch (s) {
      case 'APPROVED': case 'CERTIFICATE_ISSUED': return 'success';
      case 'UNDER_REVIEW': case 'REQUESTED': return 'info';
      case 'REJECTED': case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  }
}
