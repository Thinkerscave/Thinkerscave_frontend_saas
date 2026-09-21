import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { FeesApiService } from '../../services/fees-api.service';
import {
  AllocationPreview,
  CollectFeeResult,
  PaymentMethod,
  StudentFeeListItem
} from '../../models/fees.model';

@Component({
  selector: 'app-collect-fee-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule, TcPageSkeletonComponent],
  templateUrl: './collect-fee-dialog.component.html',
  styleUrls: ['./collect-fee-dialog.component.scss', '../../fees.shared.scss']
})
export class CollectFeeDialogComponent implements OnChanges {
  private readonly api = inject(FeesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() academicYearId: number | null = null;
  @Input() lockedStudent: StudentFeeListItem | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() collected = new EventEmitter<CollectFeeResult>();

  methods: PaymentMethod[] = [];
  suggestions: StudentFeeListItem[] = [];
  selectedStudent: StudentFeeListItem | null = null;
  studentQuery = '';
  preview: AllocationPreview | null = null;
  previewLoading = false;
  saving = false;
  lastResult: CollectFeeResult | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private resultCloseTimer: ReturnType<typeof setTimeout> | null = null;

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paymentMethodId: [null as number | null, Validators.required],
    paidOn: [this.nowLocal(), Validators.required],
    referenceNumber: [''],
    remarks: ['']
  });

  get effectiveStudentId(): number | null {
    return this.lockedStudent?.studentId ?? this.selectedStudent?.studentId ?? null;
  }

  get activeStudent(): StudentFeeListItem | null {
    return this.lockedStudent ?? this.selectedStudent;
  }

  get quickAmounts(): number[] {
    const outstanding = Number(this.activeStudent?.outstanding ?? 0);
    if (outstanding <= 0) return [];
    const amounts = [outstanding];
    if (outstanding >= 1000) {
      const round500 = Math.floor(outstanding / 500) * 500;
      const round1000 = Math.floor(outstanding / 1000) * 1000;
      if (round1000 > 0 && round1000 < outstanding) amounts.push(round1000);
      if (round500 > 0 && round500 < outstanding && round500 !== round1000) amounts.push(round500);
    } else if (outstanding >= 100) {
      const half = Math.round((outstanding / 2) * 100) / 100;
      if (half > 0 && half < outstanding) amounts.push(half);
    }
    return [...new Set(amounts)].slice(0, 3);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.api.listPaymentMethods('ACTIVE').subscribe({
        next: m => {
          this.methods = m ?? [];
          this.cdr.detectChanges();
        },
        error: () => {
          this.methods = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (!q || q.trim().length < 2 || this.academicYearId == null) {
      this.suggestions = [];
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.api.searchStudents(q.trim(), this.academicYearId!).subscribe({
        next: rows => this.suggestions = rows,
        error: () => this.suggestions = []
      });
    }, 300);
  }

  pickStudent(s: StudentFeeListItem): void {
    this.selectedStudent = s;
    this.studentQuery = s.studentName;
    this.suggestions = [];
    this.refreshPreview();
  }

  applyAmount(amount: number): void {
    this.form.patchValue({ amount });
    this.refreshPreview();
  }

  refreshPreview(): void {
    if (!this.effectiveStudentId || this.academicYearId == null || this.form.invalid) {
      this.preview = null;
      return;
    }
    const raw = this.form.getRawValue();
    this.previewLoading = true;
    this.api.previewPayment({
      studentId: this.effectiveStudentId,
      academicYearId: this.academicYearId,
      amount: Number(raw.amount),
      paymentMethodId: Number(raw.paymentMethodId),
      paidOn: this.toIso(raw.paidOn!),
      referenceNumber: raw.referenceNumber || null,
      remarks: raw.remarks || null
    }).pipe(finalizeBusy(v => (this.previewLoading = v))).subscribe({
      next: p => { this.preview = p; },
      error: () => { this.preview = null; }
    });
  }

  collect(): void {
    if (this.form.invalid || !this.effectiveStudentId || this.academicYearId == null) {
      this.form.markAllAsTouched();
      return;
    }
    const method = this.methods.find(m => m.feePaymentMethodId === this.form.value.paymentMethodId);
    if (method?.requiresReference && !this.form.value.referenceNumber?.trim()) {
      this.feedback.formError('Reference number is required for this payment method.');
      return;
    }
    const raw = this.form.getRawValue();
    this.saving = true;
    const key = crypto.randomUUID();
    this.api.collectPayment({
      studentId: this.effectiveStudentId,
      academicYearId: this.academicYearId,
      amount: Number(raw.amount),
      paymentMethodId: Number(raw.paymentMethodId),
      paidOn: this.toIso(raw.paidOn!),
      referenceNumber: raw.referenceNumber || null,
      remarks: raw.remarks || null
    }, key).pipe(finalizeBusy(v => (this.saving = v))).subscribe({
      next: result => {
        this.feedback.success('Payment collected', result.receiptNumber
          ? `Receipt ${result.receiptNumber}`
          : 'Receipt generated');
        this.lastResult = result;
        this.collected.emit(result);
        if (this.resultCloseTimer) clearTimeout(this.resultCloseTimer);
        this.resultCloseTimer = setTimeout(() => this.close(), 1200);
      },
      error: err => {
        this.feedback.error('Collection failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  close(): void {
    if (this.resultCloseTimer) {
      clearTimeout(this.resultCloseTimer);
      this.resultCloseTimer = null;
    }
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private resetForm(): void {
    this.form.reset({
      amount: null,
      paymentMethodId: null,
      paidOn: this.nowLocal(),
      referenceNumber: '',
      remarks: ''
    });
    this.selectedStudent = this.lockedStudent;
    this.studentQuery = this.lockedStudent?.studentName ?? '';
    this.suggestions = [];
    this.preview = null;
    this.lastResult = null;
  }

  private nowLocal(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  private toIso(local: string): string {
    return new Date(local).toISOString();
  }
}
