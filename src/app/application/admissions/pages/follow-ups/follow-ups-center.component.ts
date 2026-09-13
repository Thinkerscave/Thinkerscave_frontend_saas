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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { admissionsPageConfig } from '../../data/admissions-workspace.config';
import { FollowUpRecord } from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { defaultPageSizeForView, pageSizeOptionsForView } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';

type FollowUpTab = 'today' | 'overdue' | 'upcoming' | 'completed';

const LIST_KEY = 'tc.follow-ups.list';

@Component({
  selector: 'app-follow-ups-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    RouterLink,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent,
    SaasTabsComponent,
    AppPaginatorComponent
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
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly listContext = inject(ListContextService);

  readonly pageConfig = admissionsPageConfig('follow-ups');

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<FollowUpTab>('today');
  readonly todayItems = signal<FollowUpRecord[]>([]);
  readonly overdueItems = signal<FollowUpRecord[]>([]);
  readonly upcomingItems = signal<FollowUpRecord[]>([]);
  readonly completedItems = signal<FollowUpRecord[]>([]);

  readonly tabs: SaasTab[] = [
    { key: 'today', label: 'Today', icon: 'pi pi-calendar' },
    { key: 'overdue', label: 'Overdue', icon: 'pi pi-exclamation-triangle' },
    { key: 'upcoming', label: 'Upcoming', icon: 'pi pi-clock' },
    { key: 'completed', label: 'Completed', icon: 'pi pi-check-circle' }
  ];

  readonly panelTitle = computed(() => {
    const tab = this.activeTab();
    if (tab === 'today') return "Today's Follow-ups";
    if (tab === 'overdue') return 'Overdue Follow-ups';
    if (tab === 'upcoming') return 'Upcoming Follow-ups';
    return 'Completed Follow-ups';
  });

  readonly panelSubtitle = computed(() => {
    if (this.activeTab() === 'completed') {
      return 'Completed planned actions for your assigned leads';
    }
    return 'Your counselor work queue — open a lead to record counseling';
  });

  readonly stats = computed((): SaasStat[] => {
    const today = this.todayItems().length;
    const overdue = this.overdueItems().length;
    const upcoming = this.upcomingItems().length;
    return [
      { key: 'today', label: 'Today', value: today, icon: 'pi pi-calendar', tone: 'info', helper: 'Due today' },
      { key: 'overdue', label: 'Overdue', value: overdue, icon: 'pi pi-exclamation-triangle', tone: 'danger', helper: 'Past due' },
      { key: 'upcoming', label: 'Upcoming', value: upcoming, icon: 'pi pi-clock', tone: 'primary', helper: 'Scheduled ahead' }
    ];
  });

  readonly visibleItems = computed((): FollowUpRecord[] => {
    const tab = this.activeTab();
    if (tab === 'today') return this.todayItems();
    if (tab === 'overdue') return this.overdueItems();
    if (tab === 'upcoming') return this.upcomingItems();
    return this.completedItems();
  });

  pageIndex = 0;
  pageSize = defaultPageSizeForView('table');

  get pageSizeOptions(): number[] {
    return pageSizeOptionsForView('table');
  }

  get pagedItems(): FollowUpRecord[] {
    const start = this.pageIndex * this.pageSize;
    return this.visibleItems().slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.pageIndex = saved.page ?? this.pageIndex;
      this.pageSize = saved.size ?? this.pageSize;
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const tab = params.get('tab') ?? saved?.tab;
      if (tab === 'today' || tab === 'overdue' || tab === 'upcoming' || tab === 'completed') {
        this.activeTab.set(tab);
      } else if (tab === 'all') {
        // Legacy bookmark → Completed (open work is covered by the other tabs)
        this.activeTab.set('completed');
      }
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const empty: FollowUpRecord[] = [];
    forkJoin({
      today: this.api.todayFollowUps().pipe(catchError(() => of(empty))),
      overdue: this.api.overdueFollowUps().pipe(catchError(() => of(empty))),
      upcoming: this.api.upcomingFollowUps().pipe(catchError(() => of(empty))),
      completed: this.api.completedFollowUps().pipe(catchError(() => of(empty)))
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ today, overdue, upcoming, completed }) => {
          this.todayItems.set(today);
          this.overdueItems.set(overdue);
          this.upcomingItems.set(upcoming);
          this.completedItems.set(completed);

          // If Today is empty but Overdue has work, land on Overdue so the queue isn't blank.
          if (
            this.activeTab() === 'today' &&
            today.length === 0 &&
            overdue.length > 0 &&
            !this.route.snapshot.queryParamMap.get('tab')
          ) {
            this.onTabChange('overdue');
          }
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

  onPageChange(event: { page?: number; rows?: number }): void {
    this.pageIndex = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.pageIndex = 0;
    }
  }

  openLead(inquiryId: number): void {
    this.persistListContext();
    this.nav.toLead(inquiryId, 'follow-ups');
  }

  formatType(type: string | null | undefined): string {
    return (type || '—').replace(/_/g, ' ');
  }

  statusLabel(item: FollowUpRecord): string {
    if (item.lifecycleStatus === 'COMPLETED') return 'COMPLETED';
    if (item.lifecycleStatus === 'CANCELLED') return 'CANCELLED';
    if (this.activeTab() === 'overdue' || this.isOverdue(item)) return 'OVERDUE';
    return item.lifecycleStatus || 'SCHEDULED';
  }

  statusTone(item: FollowUpRecord): string {
    if (item.lifecycleStatus === 'COMPLETED') return 'success';
    if (this.activeTab() === 'overdue' || this.isOverdue(item)) return 'danger';
    return 'info';
  }

  isOverdue(item: FollowUpRecord): boolean {
    return this.overdueItems().some(o => o.followUpId === item.followUpId);
  }

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.pageIndex,
      size: this.pageSize,
      tab: this.activeTab()
    });
  }
}
