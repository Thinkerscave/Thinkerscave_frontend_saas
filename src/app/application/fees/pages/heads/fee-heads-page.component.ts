import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { UI_PAGINATION, UI_SEARCH } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import {
  AppGridTableToggleComponent,
  AppListViewMode,
  AppPaginatorComponent
} from '../../../../shared/ui/app-list';
import { ViewPreferenceService } from '../../../services/view-preference.service';
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
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    RouterLink,
    HasPermissionDirective,
    AppToastComponent,
    SaasPageHeaderComponent,
    TcPageSkeletonComponent,
    AppGridTableToggleComponent,
    AppPaginatorComponent
  ],
  templateUrl: './fee-heads-page.component.html',
  styleUrls: ['./fee-heads-page.component.scss', '../../fees.shared.scss']
})
export class FeeHeadsPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(UiFeedbackService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewPrefs = inject(ViewPreferenceService);
  readonly permissions = inject(PermissionService);

  readonly resources = FEES_RESOURCES;
  readonly categoryLabels = FEE_HEAD_CATEGORY_LABELS;
  readonly categories = Object.keys(FEE_HEAD_CATEGORY_LABELS) as FeeHeadCategory[];
  readonly pageSizeOptions = UI_PAGINATION.options;
  readonly statusOptions: { label: string; value: '' | FeeMasterStatus }[] = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
  ];

  private readonly search$ = new Subject<string>();

  rows: FeeHead[] = [];
  loading = true;
  saving = false;
  error: string | null = null;
  dialogVisible = false;
  editing: FeeHead | null = null;

  q = '';
  category = '';
  status: '' | FeeMasterStatus = '';
  viewMode: AppListViewMode = this.viewPrefs.globalDefault();
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    category: ['ACADEMIC' as FeeHeadCategory, Validators.required],
    description: ['', Validators.maxLength(500)],
    status: ['ACTIVE' as FeeMasterStatus, Validators.required]
  });

  get canManage(): boolean {
    return this.permissions.canManage(this.resources.HEADS);
  }

  get hasActiveFilters(): boolean {
    return !!this.q.trim() || !!this.category || !!this.status;
  }

  get isFilterEmptyState(): boolean {
    return this.hasActiveFilters && !this.rows.length && !this.loading && !this.error;
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(UI_SEARCH.debounceMs), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.load({ soft: true });
      });
    this.load();
  }

  onSearchChange(value: string): void {
    this.q = value ?? '';
    this.search$.next(this.q.trim());
  }

  onCategoryChange(value: string): void {
    this.category = value ?? '';
    this.page = 0;
    this.load({ soft: true });
  }

  onStatusChange(value: '' | FeeMasterStatus): void {
    this.status = value ?? '';
    this.page = 0;
    this.load({ soft: true });
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.size) {
      this.size = event.rows;
      this.page = 0;
    }
    this.load({ soft: true });
  }

  clearFilters(): void {
    this.q = '';
    this.category = '';
    this.status = '';
    this.page = 0;
    this.load({ soft: true });
  }

  load(opts?: { soft?: boolean }): void {
    const soft = !!opts?.soft && this.rows.length > 0;
    if (!soft) {
      this.loading = true;
      this.rows = [];
    } else {
      this.loading = true;
    }
    this.error = null;
    this.api
      .listHeads(
        {
          q: this.q.trim() || undefined,
          category: this.category || undefined,
          status: this.status || undefined
        },
        this.page,
        this.size
      )
      .pipe(finalizeBusy(v => {
        this.loading = v;
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

  openCreate(): void {
    if (!this.canManage) return;
    this.editing = null;
    this.form.reset({ name: '', category: 'ACADEMIC', description: '', status: 'ACTIVE' });
    this.dialogVisible = true;
  }

  openEdit(row: FeeHead): void {
    if (!this.canManage) return;
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
    if (!this.canManage) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.feedback.formError('Please complete all required fields.');
      return;
    }
    const raw = this.form.getRawValue();
    const name = (raw.name ?? '').trim();
    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      this.form.controls.name.markAsTouched();
      this.feedback.formError('Fee head name is required.');
      return;
    }
    const body = {
      name,
      category: raw.category as FeeHeadCategory,
      description: (raw.description ?? '').trim() || null,
      status: raw.status as FeeMasterStatus
    };
    this.saving = true;
    const req$ = this.editing
      ? this.api.updateHead(this.editing.feeHeadId, body)
      : this.api.createHead(body);
    req$.pipe(finalizeBusy(v => {
      this.saving = v;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.dialogVisible = false;
        this.feedback.success(this.editing ? 'Fee head updated' : 'Fee head created', body.name);
        this.load();
      },
      error: err => {
        this.feedback.error('Save failed', extractApiError(err, 'Request failed').message);
      }
    });
  }

  categoryLabel(c: FeeHeadCategory | string | null | undefined): string {
    if (!c) return '—';
    return this.categoryLabels[c as FeeHeadCategory] ?? String(c);
  }
}
