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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { finalize, forkJoin } from 'rxjs';

import {
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { FOLLOW_UP_TYPES, admissionsPageConfig } from '../../data/admissions-workspace.config';
import { FollowUpRecord, FollowUpType, LeadStatus } from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';

type FollowUpTab = 'today' | 'overdue' | 'all';

@Component({
  selector: 'app-follow-ups-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    DropdownModule,
    ToastModule,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageConfig = admissionsPageConfig('follow-ups');
  readonly followUpTypes = FOLLOW_UP_TYPES;
  readonly followUpTypeOptions = FOLLOW_UP_TYPES.map(t => ({ label: t, value: t }));
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
  readonly activeTab = signal<FollowUpTab>('today');
  readonly todayItems = signal<FollowUpRecord[]>([]);
  readonly overdueItems = signal<FollowUpRecord[]>([]);
  readonly showScheduleForm = signal(false);

  readonly tabs: SaasTab[] = [
    { key: 'today', label: 'Today', icon: 'pi pi-calendar' },
    { key: 'overdue', label: 'Overdue', icon: 'pi pi-exclamation-triangle' },
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
    return this.mergeFollowUps(this.todayItems(), this.overdueItems());
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'today' || tab === 'overdue' || tab === 'all') {
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
      overdue: this.api.overdueFollowUps()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ today, overdue }) => {
          this.todayItems.set(today);
          this.overdueItems.set(overdue);
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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  complete(item: FollowUpRecord): void {
    this.api.completeFollowUp(item.followUpId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Completed', detail: 'Follow-up marked complete.' });
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
          this.showScheduleForm.set(false);
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not schedule follow-up.' })
      });
  }

  openLead(inquiryId: number): void {
    this.router.navigate(['/app/admissions/lead', inquiryId]);
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
