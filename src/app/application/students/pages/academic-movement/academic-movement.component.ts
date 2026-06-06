import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PromotionBatch, PromotionRecord } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

type WizardStep = 'SELECT' | 'REVIEW' | 'CONFIRM' | 'DONE';

@Component({
  selector: 'app-academic-movement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './academic-movement.component.html'
})
export class AcademicMovementComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  batches: PromotionBatch[] = [];

  step: WizardStep = 'SELECT';
  readonly steps: { key: WizardStep; label: string; hint: string }[] = [
    { key: 'SELECT',  label: '1. Select Class',     hint: 'Source class & batch' },
    { key: 'REVIEW',  label: '2. Review Students',  hint: 'Eligibility & decisions' },
    { key: 'CONFIRM', label: '3. Preview & Confirm',hint: 'Final summary' },
    { key: 'DONE',    label: '4. Complete',          hint: 'Promotion executed' }
  ];

  newBatch: PromotionBatch = {};
  currentBatch?: PromotionBatch;
  records: PromotionRecord[] = [];

  readonly decisions: { value: 'PROMOTE' | 'REPEAT' | 'HOLD' | 'TRANSFER_OUT'; label: string }[] = [
    { value: 'PROMOTE', label: 'Promote' },
    { value: 'REPEAT', label: 'Repeat' },
    { value: 'HOLD', label: 'Hold' },
    { value: 'TRANSFER_OUT', label: 'Transfer Out' }
  ];

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.loading = true;
    this.api.listPromotions()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: b => { this.batches = b ?? []; },
        error: () => { this.errorMessage = 'Could not load promotion batches.'; }
      });
  }

  createBatch(): void {
    if (!this.newBatch.fromClassId || !this.newBatch.toClassId
        || !this.newBatch.fromAcademicYearId || !this.newBatch.toAcademicYearId) {
      this.errorMessage = 'Please fill class & academic year fields.';
      return;
    }
    this.saving = true;
    this.api.createPromotion(this.newBatch)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: batch => {
          this.currentBatch = batch;
          this.batches = [batch, ...this.batches];
          this.preview();
        },
        error: () => { this.errorMessage = 'Could not create promotion batch.'; }
      });
  }

  preview(): void {
    if (!this.currentBatch?.id) return;
    this.saving = true;
    this.api.previewPromotion(this.currentBatch.id)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: list => {
          this.records = list ?? [];
          this.step = 'REVIEW';
        },
        error: () => { this.errorMessage = 'Could not generate preview.'; }
      });
  }

  updateRecord(rec: PromotionRecord): void {
    if (!rec.id) return;
    this.api.updatePromotionRecord(rec.id, rec).subscribe({
      next: updated => { Object.assign(rec, updated); this.cdr.markForCheck(); }
    });
  }

  executeBatch(): void {
    if (!this.currentBatch?.id) return;
    this.saving = true;
    this.api.executePromotion(this.currentBatch.id)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: batch => {
          this.currentBatch = batch;
          this.successMessage = 'Promotion executed successfully.';
          this.step = 'DONE';
          this.loadBatches();
        },
        error: () => { this.errorMessage = 'Promotion execution failed.'; }
      });
  }

  goToStep(s: WizardStep): void {
    if (s === 'REVIEW' && !this.records.length) { return; }
    this.step = s;
  }

  selectBatch(b: PromotionBatch): void {
    this.currentBatch = b;
    this.records = [];
    this.preview();
  }

  totalCount(): number { return this.records.length; }
  eligibleCount(): number { return this.records.filter(r => r.decision !== 'HOLD').length; }
  holdCount(): number { return this.records.filter(r => r.decision === 'HOLD').length; }
}
