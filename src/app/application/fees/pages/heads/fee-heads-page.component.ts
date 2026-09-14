import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { finalize } from 'rxjs';
import { FeesApiService } from '../../services/fees-api.service';
import {
  FEE_HEAD_CATEGORY_LABELS,
  FEES_RESOURCES,
  FeeHead,
  FeeHeadCategory,
  FeeMasterStatus
} from '../../models/fees.model';

@Component({
  selector: 'app-fee-heads-page',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DialogModule, ConfirmDialogModule,
    HasPermissionDirective, AppToastComponent, SaasPageHeaderComponent
  ],
  templateUrl: './fee-heads-page.component.html',
  styleUrls: ['./fee-heads-page.component.scss', '../../fees.shared.scss']
})
export class FeeHeadsPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);
  private readonly confirm = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly resources = FEES_RESOURCES;
  readonly categoryLabels = FEE_HEAD_CATEGORY_LABELS;
  readonly categories = Object.keys(FEE_HEAD_CATEGORY_LABELS) as FeeHeadCategory[];

  rows: FeeHead[] = [];
  loading = true;
  saving = false;
  error: string | null = null;
  dialogVisible = false;
  editing: FeeHead | null = null;

  q = '';
  category = '';
  status = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    category: ['ACADEMIC' as FeeHeadCategory, Validators.required],
    description: ['', Validators.maxLength(500)],
    status: ['ACTIVE' as FeeMasterStatus, Validators.required]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.listHeads({ q: this.q || undefined, category: this.category || undefined, status: this.status || undefined }, this.page, this.size)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: page => {
          this.rows = page?.content ?? [];
          this.total = page?.totalElements ?? 0;
          this.cdr.markForCheck();
        },
        error: err => {
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load fee heads';
          this.cdr.markForCheck();
        }
      });
  }

  search(): void {
    this.page = 0;
    this.load();
  }

  reset(): void {
    this.q = '';
    this.category = '';
    this.status = '';
    this.page = 0;
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ name: '', category: 'ACADEMIC', description: '', status: 'ACTIVE' });
    this.dialogVisible = true;
  }

  openEdit(row: FeeHead): void {
    this.editing = row;
    this.form.reset({
      name: row.name,
      category: row.category,
      description: row.description ?? '',
      status: row.status
    });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      name: (raw.name ?? '').trim(),
      category: raw.category as FeeHeadCategory,
      description: (raw.description ?? '').trim() || null,
      status: raw.status as FeeMasterStatus
    };
    this.saving = true;
    const req$ = this.editing
      ? this.api.updateHead(this.editing.feeHeadId, body)
      : this.api.createHead(body);
    req$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.feedback.success(this.editing ? 'Fee head updated' : 'Fee head created', body.name);
        this.load();
      },
      error: err => {
        this.saving = false;
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  toggleStatus(row: FeeHead): void {
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.confirm.confirm({
      message: `Set "${row.name}" to ${next}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.patchHeadStatus(row.feeHeadId, next).subscribe({
          next: () => {
            this.feedback.success('Status updated', row.name);
            this.load();
          },
          error: err => this.feedback.error('Status change failed', extractApiError(err, 'Request failed').message)
        });
      }
    });
  }

  remove(row: FeeHead): void {
    this.confirm.confirm({
      message: `Delete "${row.name}"? This is only allowed when unused.`,
      header: 'Delete Fee Head',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deleteHead(row.feeHeadId).subscribe({
          next: () => {
            this.feedback.success('Deleted', row.name);
            this.load();
          },
          error: err => this.feedback.error('Delete failed', extractApiError(err, 'Request failed').message)
        });
      }
    });
  }

  categoryLabel(c: FeeHeadCategory): string {
    return this.categoryLabels[c] ?? c;
  }
}
