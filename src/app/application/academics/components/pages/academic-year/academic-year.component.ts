import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicYearTransitionApiService } from '../../../services/academic-year-transition-api.service';
import {
  ACADEMIC_YEAR_RESOURCE,
  AcademicYearDashboard,
  AcademicYearDto,
  AcademicYearPattern,
  AcademicYearStatus,
  ReadinessStep
} from '../../../models/academic-year.model';
import {
  ACADEMICS_TRANSITION_RESOURCE,
  AcademicYearTransitionDto
} from '../../../models/academic-year-transition.model';

@Component({
  selector: 'app-academic-year-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DialogModule,
    DropdownModule,
    ProgressBarModule,
    TableModule,
    SaasPageHeaderComponent,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './academic-year.component.html',
  styleUrls: ['./academic-year.component.scss']
})
export class AcademicYearPageComponent implements OnInit {
  private readonly api = inject(AcademicYearApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  readonly permissions = inject(PermissionService);

  private readonly transitionApi = inject(AcademicYearTransitionApiService);
  readonly resource = ACADEMIC_YEAR_RESOURCE;
  readonly transitionResource = ACADEMICS_TRANSITION_RESOURCE;

  loading = true;
  saving = false;
  dashboard: AcademicYearDashboard | null = null;
  history: AcademicYearDto[] = [];
  searchTerm = '';
  statusFilter: AcademicYearStatus | null = null;

  showCreate = false;
  showReject = false;
  rejectTargetId: number | null = null;
  rejectReason = '';

  showTransition = false;
  transitionSaving = false;
  transitions: AcademicYearTransitionDto[] = [];
  transitionYears: AcademicYearDto[] = [];
  transitionTargetYearId: number | null = null;
  transitionCopyClasses = true;
  transitionCopySections = true;
  transitionCopySubjects = true;
  transitionCopyMappings = true;
  transitionCopyAllocations = false;

  readonly statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Current', value: 'CURRENT' },
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Archived', value: 'ARCHIVED' },
    { label: 'Rejected', value: 'REJECTED' }
  ];

  readonly patternOptions: { label: string; value: AcademicYearPattern }[] = [
    { label: 'Annual', value: 'ANNUAL' },
    { label: 'Semester', value: 'SEMESTER' },
    { label: 'Trimester', value: 'TRIMESTER' },
    { label: 'Term Based', value: 'TERM' },
    { label: 'Custom', value: 'CUSTOM' }
  ];

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    pattern: ['ANNUAL' as AcademicYearPattern, Validators.required]
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.api
      .getDashboard()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
          this.history = dash.history ?? [];
          this.applyLocalFilter();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Unable to load Academic Year',
            detail: err?.error?.message || 'Please try again'
          });
        }
      });
  }

  applyLocalFilter(): void {
    const source = this.dashboard?.history ?? [];
    const q = this.searchTerm.trim().toLowerCase();
    this.history = source.filter((y) => {
      const matchesQ = !q || y.name.toLowerCase().includes(q);
      const matchesStatus = !this.statusFilter || y.status === this.statusFilter;
      return matchesQ && matchesStatus;
    });
  }

  openCreate(): void {
    this.createForm.reset({ name: '', startDate: '', endDate: '', pattern: 'ANNUAL' });
    this.showCreate = true;
  }

  suggestNameFromDates(): void {
    const start = this.createForm.value.startDate;
    const end = this.createForm.value.endDate;
    if (!start || !end) return;
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    const name = endYear === startYear ? `${startYear}` : `${startYear}–${String(endYear).slice(-2)}`;
    this.createForm.patchValue({ name });
  }

  saveCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    this.saving = true;
    this.api
      .create({
        name: value.name!.trim(),
        startDate: value.startDate!,
        endDate: value.endDate!,
        pattern: value.pattern!
      })
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.showCreate = false;
          this.messages.add({ severity: 'success', summary: 'Academic year created' });
          this.reload();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Create failed',
          detail: err?.error?.message || 'Unable to create academic year'
        })
      });
  }

  statusLabel(status: AcademicYearStatus): string {
    const map: Record<AcademicYearStatus, string> = {
      DRAFT: 'Draft',
      PREPARING: 'Setup In Progress',
      READY_FOR_APPROVAL: 'Ready for Approval',
      PENDING_APPROVAL: 'Pending Approval',
      APPROVED: 'Approved',
      CURRENT: 'Current',
      COMPLETED: 'Completed',
      ARCHIVED: 'Archived',
      REJECTED: 'Rejected'
    };
    return map[status] || status;
  }

  statusTone(status: AcademicYearStatus): string {
    if (status === 'CURRENT') return 'success';
    if (status === 'COMPLETED' || status === 'ARCHIVED') return 'neutral';
    if (status === 'REJECTED') return 'danger';
    if (status === 'PENDING_APPROVAL' || status === 'APPROVED') return 'info';
    return 'warning';
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatRange(year: AcademicYearDto): string {
    return `${this.formatDate(year.startDate)} – ${this.formatDate(year.endDate)}`;
  }

  stepIcon(state: ReadinessStep['state']): string {
    switch (state) {
      case 'COMPLETE': return 'pi pi-check-circle';
      case 'PENDING': return 'pi pi-exclamation-triangle';
      case 'IN_PROGRESS': return 'pi pi-info-circle';
      default: return 'pi pi-circle';
    }
  }

  primaryHistoryAction(year: AcademicYearDto): string {
    if (['DRAFT', 'PREPARING', 'READY_FOR_APPROVAL', 'REJECTED', 'PENDING_APPROVAL'].includes(year.status)) {
      return 'Continue Setup';
    }
    return 'View Details';
  }

  onHistoryAction(year: AcademicYearDto): void {
    if (year.status === 'APPROVED' && this.permissions.canApprove(this.resource)) {
      this.confirmActivate(year);
      return;
    }
    if (['DRAFT', 'PREPARING', 'READY_FOR_APPROVAL', 'REJECTED'].includes(year.status)) {
      this.continueSetup(year);
      return;
    }
    this.messages.add({
      severity: 'info',
      summary: year.name,
      detail: `${this.statusLabel(year.status)} · ${this.formatRange(year)}`
    });
  }

  continueSetup(year: AcademicYearDto): void {
    if (year.status === 'PREPARING' || year.status === 'DRAFT' || year.status === 'REJECTED') {
      this.api.markReady(year.academicYearId).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Marked ready for approval' });
          this.reload();
        },
        error: () =>           this.router.navigate(['/app/academics/classes-sections'])
      });
      return;
    }
    this.router.navigate(['/app/academics/classes-sections']);
  }

  submitForApproval(year: AcademicYearDto): void {
    this.api.submit(year.academicYearId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Submitted for approval' });
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Submit failed',
        detail: err?.error?.message || 'Unable to submit'
      })
    });
  }

  approve(year: AcademicYearDto): void {
    this.api.approve(year.academicYearId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Academic year approved' });
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Approval failed',
        detail: err?.error?.message || 'Unable to approve'
      })
    });
  }

  openReject(year: AcademicYearDto): void {
    this.rejectTargetId = year.academicYearId;
    this.rejectReason = '';
    this.showReject = true;
  }

  confirmReject(): void {
    if (!this.rejectTargetId || !this.rejectReason.trim()) return;
    this.api.reject(this.rejectTargetId, this.rejectReason.trim()).subscribe({
      next: () => {
        this.showReject = false;
        this.messages.add({ severity: 'warn', summary: 'Academic year rejected' });
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Reject failed',
        detail: err?.error?.message || 'Unable to reject'
      })
    });
  }

  confirmActivate(year: AcademicYearDto): void {
    this.confirm.confirm({
      header: `Activate ${year.name}?`,
      message: `This will make ${year.name} the current academic year and move the previous current year to Completed. This action cannot be automatically reversed.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm Activation',
      rejectLabel: 'Cancel',
      accept: () => {
        this.api.activate(year.academicYearId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: `${year.name} is now current` });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Activation failed',
            detail: err?.error?.message || 'Unable to activate'
          })
        });
      }
    });
  }

  deactivate(year: AcademicYearDto): void {
    this.confirm.confirm({
      header: 'Deactivate academic year',
      message: `${year.name} will remain in history with is_active = false.`,
      acceptLabel: 'Deactivate',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deactivate(year.academicYearId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Academic year deactivated' });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Deactivate failed',
            detail: err?.error?.message || 'Unable to deactivate'
          })
        });
      }
    });
  }

  openTransition(): void {
    const current = this.dashboard?.currentYear;
    if (!current?.academicYearId) {
      this.messages.add({ severity: 'warn', summary: 'No current year', detail: 'Activate a current year before starting a transition.' });
      return;
    }
    this.transitionYears = (this.dashboard?.history ?? []).filter(
      (y) => y.academicYearId !== current.academicYearId && !['COMPLETED', 'ARCHIVED', 'CURRENT'].includes(y.status)
    );
    this.transitionTargetYearId = this.transitionYears[0]?.academicYearId ?? null;
    this.transitionCopyClasses = true;
    this.transitionCopySections = true;
    this.transitionCopySubjects = true;
    this.transitionCopyMappings = true;
    this.transitionCopyAllocations = false;
    this.showTransition = true;
    this.loadTransitions(current.academicYearId);
  }

  loadTransitions(yearId: number): void {
    this.transitionApi.list(yearId).subscribe({
      next: (list) => {
        this.transitions = list;
        this.cdr.markForCheck();
      },
      error: () => {
        this.transitions = [];
        this.cdr.markForCheck();
      }
    });
  }

  createTransition(): void {
    const sourceId = this.dashboard?.currentYear?.academicYearId;
    if (!sourceId || !this.transitionTargetYearId) {
      this.messages.add({ severity: 'warn', summary: 'Select a target academic year' });
      return;
    }
    this.transitionSaving = true;
    this.transitionApi
      .create(sourceId, {
        targetAcademicYearId: this.transitionTargetYearId,
        copyClasses: this.transitionCopyClasses,
        copySections: this.transitionCopySections,
        copySubjects: this.transitionCopySubjects,
        copyMappings: this.transitionCopyMappings,
        copyAllocations: this.transitionCopyAllocations
      })
      .pipe(finalize(() => {
        this.transitionSaving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Transition created' });
          this.loadTransitions(sourceId);
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Create transition failed',
          detail: err?.error?.message || 'Unable to create transition'
        })
      });
  }

  startTransition(row: AcademicYearTransitionDto): void {
    this.transitionApi.start(row.academicYearTransitionId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Transition started — structure copy running' });
        const sourceId = this.dashboard?.currentYear?.academicYearId;
        if (sourceId) this.loadTransitions(sourceId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Start failed',
        detail: err?.error?.message || 'Unable to start transition'
      })
    });
  }

  approveTransition(row: AcademicYearTransitionDto): void {
    this.transitionApi.approve(row.academicYearTransitionId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Transition approved' });
        const sourceId = this.dashboard?.currentYear?.academicYearId;
        if (sourceId) this.loadTransitions(sourceId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Approve failed',
        detail: err?.error?.message || 'Unable to approve transition'
      })
    });
  }

  transitionStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }
}
