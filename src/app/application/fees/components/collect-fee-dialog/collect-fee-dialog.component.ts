import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule],
  template: `
    <p-dialog
      header="Collect Fee"
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [style]="{ width: '640px', maxWidth: '95vw' }"
      [draggable]="false"
      styleClass="fees-collect-dialog">
      <form [formGroup]="form" class="flex flex-column gap-3" (ngSubmit)="collect()">
        <div>
          <label class="block mb-1">Student *</label>
          @if (lockedStudent) {
            <div class="p-2 surface-100 border-round">
              <strong>{{ lockedStudent.studentName }}</strong>
              <div class="text-sm text-color-secondary">
                {{ lockedStudent.admissionNumber }}
                @if (lockedStudent.className) { · {{ lockedStudent.className }} }
                · Outstanding {{ lockedStudent.outstanding | number:'1.2-2' }}
              </div>
            </div>
          } @else {
            <input class="p-inputtext p-component w-full" placeholder="Search name or admission no..."
                   [(ngModel)]="studentQuery" [ngModelOptions]="{standalone: true}" (ngModelChange)="onSearch($event)" />
            @if (suggestions.length) {
              <ul class="list-none p-0 m-0 mt-1 border-1 surface-border border-round overflow-hidden">
                @for (s of suggestions; track s.studentId) {
                  <li class="p-2 cursor-pointer hover:surface-100" (click)="pickStudent(s)">
                    {{ s.studentName }} · {{ s.admissionNumber }} · {{ s.className || '—' }}
                  </li>
                }
              </ul>
            }
            @if (selectedStudent) {
              <div class="mt-2 text-sm">
                Selected: <strong>{{ selectedStudent.studentName }}</strong>
                · Outstanding {{ selectedStudent.outstanding | number:'1.2-2' }}
                · Advance {{ selectedStudent.advance || 0 | number:'1.2-2' }}
              </div>
            }
          }
        </div>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label class="block mb-1">Payment Amount *</label>
            <input class="p-inputtext p-component w-full" type="number" min="0.01" step="0.01" formControlName="amount" (blur)="refreshPreview()" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Payment Method *</label>
            <select class="p-inputtext p-component w-full" formControlName="paymentMethodId" (change)="refreshPreview()">
              <option [ngValue]="null" disabled>Select method</option>
              @for (m of methods; track m.feePaymentMethodId) {
                <option [ngValue]="m.feePaymentMethodId">{{ m.name }}</option>
              }
            </select>
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Payment Date *</label>
            <input class="p-inputtext p-component w-full" type="datetime-local" formControlName="paidOn" />
          </div>
          <div class="col-12 md:col-6">
            <label class="block mb-1">Reference / Transaction No.</label>
            <input class="p-inputtext p-component w-full" formControlName="referenceNumber" />
          </div>
          <div class="col-12">
            <label class="block mb-1">Remarks</label>
            <textarea class="p-inputtext p-component w-full" rows="2" formControlName="remarks"></textarea>
          </div>
        </div>

        @if (previewLoading) {
          <div class="tc-loading"><i class="pi pi-spin pi-spinner"></i> Calculating allocation…</div>
        } @else if (preview) {
          <div class="p-3 surface-50 border-round border-1 surface-border">
            <div class="font-medium mb-2">Allocation preview</div>
            <p class="text-sm text-color-secondary m-0 mb-2">
              Applied to the oldest outstanding period first.
            </p>
            <ul class="list-none p-0 m-0">
              @for (a of preview.allocations; track a.studentBillingPeriodId) {
                <li class="flex justify-content-between py-1 border-bottom-1 surface-border">
                  <span>{{ a.periodLabel }}</span>
                  <strong>{{ a.allocatedAmount | number:'1.2-2' }}</strong>
                </li>
              } @empty {
                <li class="text-sm text-color-secondary py-1">No periods to allocate — amount may go to advance.</li>
              }
            </ul>
            <div class="flex justify-content-between mt-2">
              <span>Allocated</span><strong>{{ preview.allocatedAmount | number:'1.2-2' }}</strong>
            </div>
            <div class="flex justify-content-between">
              <span>Advance after payment</span><strong>{{ preview.advanceRemaining | number:'1.2-2' }}</strong>
            </div>
          </div>
        }

        <div class="flex justify-content-end gap-2 mt-1">
          <button type="button" class="p-button p-button-text" (click)="close()" [disabled]="saving">Cancel</button>
          <button type="submit" class="p-button" [disabled]="saving || form.invalid || !effectiveStudentId">
            @if (saving) { <i class="pi pi-spin pi-spinner mr-2"></i> }
            Collect &amp; Generate Receipt
          </button>
        </div>
      </form>
    </p-dialog>
  `,
  styleUrls: ['../../fees.shared.scss']
})
export class CollectFeeDialogComponent implements OnChanges {
  private readonly api = inject(FeesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);

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
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.api.listPaymentMethods('ACTIVE').subscribe({
        next: m => this.methods = m,
        error: () => this.methods = []
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
    }).subscribe({
      next: p => { this.preview = p; this.previewLoading = false; },
      error: () => { this.preview = null; this.previewLoading = false; }
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
    }, key).subscribe({
      next: result => {
        this.saving = false;
        this.feedback.success('Payment collected', result.receiptNumber
          ? `Receipt ${result.receiptNumber}`
          : 'Receipt generated');
        this.collected.emit(result);
        this.close();
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Collection failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  close(): void {
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
