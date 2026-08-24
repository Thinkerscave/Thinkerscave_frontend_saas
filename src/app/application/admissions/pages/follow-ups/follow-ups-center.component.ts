import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize, forkJoin } from 'rxjs';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { FOLLOW_UP_TYPES, admissionsPageConfig } from '../../data/admissions-workspace.config';
import { FollowUpRecord, FollowUpType, LeadRecord, LeadStatus } from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';

type FollowUpTab = 'today' | 'overdue' | 'upcoming' | 'all';

@Component({
  selector: 'app-follow-ups-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    DialogModule,
    PaginatorModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent,
    SaasTabsComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../admissions.shared.scss', '../../../students/students.shared.scss'],
  templateUrl: './follow-ups-center.component.html'
})
export class FollowUpsCenterComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly nav = inject(AdmissionsNavService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageConfig = admissionsPageConfig('follow-ups');
  readonly followUpTypes = FOLLOW_UP_TYPES;
  readonly followUpTypeOptions = FOLLOW_UP_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }));
  readonly statusAfterOptions = [
    { label: 'CONTACTED', value: 'CONTACTED' },
    { label: 'INTERESTED', value: 'INTERESTED' },
    { label: 'COUNSELING', value: 'COUNSELING' },
    { label: 'FOLLOW_UP_REQUIRED', value: 'FOLLOW_UP_REQUIRED' },
    { label: 'READY_FOR_ADMISSION', value: 'READY_FOR_ADMISSION' }
  ];

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly completing = signal(false);
  readonly activeTab = signal<FollowUpTab>('today');
  readonly todayItems = signal<FollowUpRecord[]>([]);
  readonly overdueItems = signal<FollowUpRecord[]>([]);
  readonly upcomingItems = signal<FollowUpRecord[]>([]);
  readonly showScheduleForm = signal(false);
  readonly leadMatches = signal<LeadRecord[]>([]);
  readonly selectedLeadLabel = signal('');
  readonly completeTarget = signal<FollowUpRecord | null>(null);
  completeOutcome = '';
  completeRemarks = '';

  get scheduleVisible(): boolean {
    return this.showScheduleForm();
  }
  set scheduleVisible(value: boolean) {
    this.showScheduleForm.set(value);
  }

  get completeVisible(): boolean {
    return !!this.completeTarget();
  }
  set completeVisible(value: boolean) {
    if (!value) this.completeTarget.set(null);
  }

  readonly tabs: SaasTab[] = [
    { key: 'today', label: 'Today', icon: 'pi pi-calendar' },
    { key: 'overdue', label: 'Overdue', icon: 'pi pi-exclamation-triangle' },
    { key: 'upcoming', label: 'Upcoming', icon: 'pi pi-clock' },
    { key: 'all', label: 'All', icon: 'pi pi-list' }
  ];

  readonly scheduleForm = this.fb.group({
    leadId: [null as number | null, [Validators.required, Validators.min(1)]],
    followUpType: ['CALL' as FollowUpType, Validators.required],
    followUpDate: [''],
    nextFollowUpDate: [''],
    statusAfter: ['CONTACTED' as LeadStatus],
    remarks: ['', [Validators.required, Validators.minLength(3)]]
  });

  readonly panelTitle = computed(() => {
    const tab = this.activeTab();
    if (tab === 'today') return "Today's Follow-ups";
    if (tab === 'overdue') return 'Overdue Follow-ups';
    if (tab === 'upcoming') return 'Upcoming Follow-ups';
    return 'All Follow-ups';
  });

  readonly stats = computed((): SaasStat[] => {
    const today = this.todayItems().length;
    const overdue = this.overdueItems().length;
    return [
      { key: 'today', label: 'Today', value: today, icon: 'pi pi-calendar', tone: 'info', helper: 'Due today' },
      { key: 'overdue', label: 'Overdue', value: overdue, icon: 'pi pi-exclamation-triangle', tone: 'danger', helper: 'Past due' },
      { key: 'all', label: 'Total Open', value: today + overdue, icon: 'pi pi-list', tone: 'primary', helper: 'Combined queue' }
    ];
  });

  readonly visibleItems = computed((): FollowUpRecord[] => {
    const tab = this.activeTab();
    if (tab === 'today') return this.todayItems();
    if (tab === 'overdue') return this.overdueItems();
    if (tab === 'upcoming') return this.upcomingItems();
    return this.mergeFollowUps(this.todayItems(), this.mergeFollowUps(this.overdueItems(), this.upcomingItems()));
  });

  pageIndex = 0;
  pageSize = 20;

  readonly pagedItems = computed((): FollowUpRecord[] => {
    const start = this.pageIndex * this.pageSize;
    return this.visibleItems().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'today' || tab === 'overdue' || tab === 'upcoming' || tab === 'all') {
        this.activeTab.set(tab);
      }
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      today: this.api.todayFollowUps(),
      overdue: this.api.overdueFollowUps(),
      upcoming: this.api.upcomingFollowUps()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ today, overdue, upcoming }) => {
          this.todayItems.set(today);
          this.overdueItems.set(overdue);
          this.upcomingItems.set(upcoming);
        },
        error: () => {
          const msg = 'Unable to load follow-ups. Please retry.';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: msg });
        }
      });
  }

  onTabChange(key: string): void {
    const tab = key as FollowUpTab;
    this.activeTab.set(tab);
    this.pageIndex = 0;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(event: PaginatorState): void {
    this.pageIndex = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
  }

  complete(item: FollowUpRecord): void {
    this.completeTarget.set(item);
    this.completeOutcome = item.outcome ?? '';
    this.completeRemarks = item.remarks ?? '';
  }

  closeCompleteDialog(): void {
    this.completeTarget.set(null);
  }

  confirmComplete(): void {
    const item = this.completeTarget();
    if (!item) return;
    this.completing.set(true);
    this.api.completeFollowUp(item.followUpId, {
      outcome: this.completeOutcome || 'COMPLETED',
      remarks: this.completeRemarks || item.remarks
    }).pipe(finalize(() => this.completing.set(false))).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Completed', detail: 'Follow-up marked complete.' });
        this.closeCompleteDialog();
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not complete follow-up.' })
    });
  }

  toggleScheduleForm(): void {
    this.showScheduleForm.update(v => !v);
  }

  submitSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }
    const raw = this.scheduleForm.getRawValue();
    const leadId = raw.leadId!;
    this.saving.set(true);
    this.api
      .addFollowUp(leadId, {
        followUpType: raw.followUpType!,
        remarks: raw.remarks,
        statusAfter: raw.statusAfter,
        followUpDate: raw.followUpDate || null,
        nextFollowUpDate: raw.nextFollowUpDate || null
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Scheduled', detail: 'Follow-up scheduled successfully.' });
          this.scheduleForm.reset({
            leadId: null,
            followUpType: 'CALL',
            followUpDate: '',
            nextFollowUpDate: '',
            statusAfter: 'CONTACTED',
            remarks: ''
          });
          this.selectedLeadLabel.set('');
          this.leadMatches.set([]);
          this.showScheduleForm.set(false);
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not schedule follow-up.' })
      });
  }

  openLead(inquiryId: number): void {
    this.nav.toLead(inquiryId, 'follow-ups');
  }

  searchLeads(keyword: string): void {
    this.selectedLeadLabel.set(keyword);
    if (!keyword || keyword.trim().length < 2) {
      this.leadMatches.set([]);
      return;
    }
    this.api.searchLeads({ keyword: keyword.trim() }, 0, 8).subscribe({
      next: page => this.leadMatches.set(page.content ?? []),
      error: () => this.leadMatches.set([])
    });
  }

  pickLead(lead: LeadRecord): void {
    this.scheduleForm.patchValue({ leadId: lead.inquiryId });
    this.selectedLeadLabel.set(`${lead.name} · ${lead.inquiryNumber || lead.mobileNumber}`);
    this.leadMatches.set([]);
  }

  canComplete(item: FollowUpRecord): boolean {
    return item.lifecycleStatus !== 'COMPLETED' && item.lifecycleStatus !== 'CANCELLED';
  }

  formatType(type: string | null | undefined): string {
    return (type || '—').replace(/_/g, ' ');
  }

  isOverdue(item: FollowUpRecord): boolean {
    return this.overdueItems().some(o => o.followUpId === item.followUpId);
  }

  private mergeFollowUps(a: FollowUpRecord[], b: FollowUpRecord[]): FollowUpRecord[] {
    const map = new Map<number, FollowUpRecord>();
    for (const item of [...a, ...b]) {
      map.set(item.followUpId, item);
    }
    return [...map.values()].sort((x, y) => (y.followUpDate ?? '').localeCompare(x.followUpDate ?? ''));
  }
}
