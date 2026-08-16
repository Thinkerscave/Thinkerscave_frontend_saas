import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicCalendarApiService } from '../../../services/academic-calendar-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import {
  ACADEMICS_CALENDAR_RESOURCE,
  AcademicCalendarDashboard,
  AcademicCalendarEventDto,
  AcademicCalendarEventRequest,
  CALENDAR_AUDIENCE_OPTIONS,
  CALENDAR_EVENT_TYPE_OPTIONS,
  CALENDAR_STATUS_OPTIONS,
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventType
} from '../../../models/academic-calendar.model';

export interface AcademicCalendarDayCell {
  dateKey: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  events: AcademicCalendarEventDto[];
}

@Component({
  selector: 'app-academic-calendar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SaasPageHeaderComponent,
    DialogModule,
    DropdownModule,
    MultiSelectModule,
    CheckboxModule,
    MenuModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './academic-calendar.component.html',
  styleUrls: ['./academic-calendar.component.scss']
})
export class AcademicCalendarPageComponent implements OnInit {
  private readonly api = inject(AcademicCalendarApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(AcademicsNavService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_CALENDAR_RESOURCE;
  readonly typeOptions = [
    { label: 'All Types', value: null },
    ...CALENDAR_EVENT_TYPE_OPTIONS
  ];
  readonly statusOptions = [
    { label: 'All Status', value: null },
    ...CALENDAR_STATUS_OPTIONS
  ];
  readonly audienceFilterOptions = [
    { label: 'All Audiences', value: null },
    ...CALENDAR_AUDIENCE_OPTIONS
  ];
  readonly eventTypeOptions = CALENDAR_EVENT_TYPE_OPTIONS;
  readonly audienceOptions = CALENDAR_AUDIENCE_OPTIONS;

  private readonly search$ = new Subject<string>();

  loading = true;
  refreshing = false;
  saving = false;
  showBack = false;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  dashboard: AcademicCalendarDashboard | null = null;
  searchTerm = '';
  typeFilter: CalendarEventType | null = null;
  statusFilter: CalendarEventStatus | null = null;
  audienceFilter: CalendarAudienceType | null = null;
  fromDate = '';
  toDate = '';
  viewMode: 'calendar' | 'list' = 'calendar';
  page = 1;
  pageSize = 12;
  /** Visible month for calendar grid (1st of month, local). */
  visibleMonth = this.startOfMonth(new Date());
  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly legendItems: { tone: string; label: string }[] = [
    { tone: 'holiday', label: 'Holiday' },
    { tone: 'exam', label: 'Examination' },
    { tone: 'school', label: 'School Event' },
    { tone: 'academic', label: 'Academic Event' },
    { tone: 'default', label: 'Other' }
  ];
  readonly maxChipsPerDay = 3;

  showEventDialog = false;
  editingEventId: number | null = null;
  editingStatus: CalendarEventStatus | null = null;
  menuItems: MenuItem[] = [];
  classOptions: { label: string; value: number }[] = [];
  sectionOptions: { label: string; value: number }[] = [];

  eventForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    eventType: ['SCHOOL_EVENT' as CalendarEventType, Validators.required],
    description: [''],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    allDay: [true],
    startTime: [''],
    endTime: [''],
    location: [''],
    audienceType: ['EVERYONE' as CalendarAudienceType, Validators.required],
    classIds: [[] as number[]],
    sectionIds: [[] as number[]]
  });

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get totalEvents(): number {
    return this.dashboard?.events?.length ?? 0;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalEvents / this.pageSize));
  }

  get pageStart(): number {
    if (!this.totalEvents) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalEvents);
  }

  get pagedEvents(): AcademicCalendarEventDto[] {
    const all = this.dashboard?.events ?? [];
    const start = (this.page - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  get upcomingPreview(): AcademicCalendarEventDto[] {
    return (this.dashboard?.upcoming ?? []).slice(0, 6);
  }

  get monthLabel(): string {
    return this.visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  get calendarDays(): AcademicCalendarDayCell[] {
    return this.buildMonthCells(this.visibleMonth, this.dashboard?.events ?? []);
  }

  get calendarWeekCount(): number {
    return Math.max(4, Math.ceil(this.calendarDays.length / 7));
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.searchTerm.trim() ||
      this.typeFilter != null ||
      this.statusFilter != null ||
      this.audienceFilter != null ||
      !!this.fromDate ||
      !!this.toDate
    );
  }

  get hasVisibleFilters(): boolean {
    return this.hasActiveFilters;
  }

  get isFilterEmptyState(): boolean {
    return this.hasActiveFilters;
  }

  get isEditingPublished(): boolean {
    return this.editingEventId != null && this.editingStatus === 'PUBLISHED';
  }

  ngOnInit(): void {
    this.showBack = this.route.snapshot.queryParamMap.get('from') === 'overview';

    this.search$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.reload();
      });

    this.eventForm.get('allDay')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    this.eventForm.get('audienceType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    this.yearApi.search().subscribe({
      next: (years) => {
        this.years = years;
        const current = years.find((y) => y.status === 'CURRENT') ?? years[0] ?? null;
        this.selectedYearId = current?.academicYearId ?? null;
        if (this.selectedYearId) {
          this.loadClassOptions(this.selectedYearId);
          this.reload();
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Unable to load academic years' });
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.nav.back(this.route);
  }

  onSearchChange(value: string): void {
    this.search$.next(value ?? '');
  }

  onFilterChange(): void {
    this.page = 1;
    this.reload();
  }

  onYearChange(): void {
    this.page = 1;
    if (this.selectedYearId) {
      this.loadClassOptions(this.selectedYearId);
    }
    this.reload();
  }

  setPage(next: number): void {
    this.page = Math.min(Math.max(1, next), this.totalPages);
    this.cdr.markForCheck();
  }

  setPageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    this.page = 1;
    this.cdr.markForCheck();
  }

  setViewMode(mode: 'calendar' | 'list'): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  shiftMonth(delta: number): void {
    const next = new Date(this.visibleMonth);
    next.setMonth(next.getMonth() + delta);
    this.visibleMonth = this.startOfMonth(next);
    this.cdr.markForCheck();
  }

  goToToday(): void {
    this.visibleMonth = this.startOfMonth(new Date());
    this.cdr.markForCheck();
  }

  onDayClick(cell: AcademicCalendarDayCell, event?: Event): void {
    event?.stopPropagation();
    if (!cell.inMonth) return;
    if (cell.events.length === 1) {
      this.openDetails(cell.events[0].eventId);
      return;
    }
    if (this.canManage) {
      this.openCreateEvent(cell.dateKey);
    }
  }

  onEventChipClick(eventId: number, event?: Event): void {
    event?.stopPropagation();
    this.openDetails(eventId);
  }

  visibleChips(cell: AcademicCalendarDayCell): AcademicCalendarEventDto[] {
    return cell.events.slice(0, this.maxChipsPerDay);
  }

  hiddenChipCount(cell: AcademicCalendarDayCell): number {
    return Math.max(0, cell.events.length - this.maxChipsPerDay);
  }

  exportEvents(): void {
    const rows = this.dashboard?.events ?? [];
    if (!rows.length) {
      this.messages.add({ severity: 'info', summary: 'No events to export' });
      return;
    }
    const header = ['Title', 'Type', 'Status', 'Start Date', 'End Date', 'All Day', 'Start Time', 'End Time', 'Audience', 'Location'];
    const lines = [
      header.join(','),
      ...rows.map((e) => [
        this.csv(e.title),
        this.csv(this.typeLabel(e.eventType)),
        this.csv(this.statusLabel(e.status)),
        this.csv(e.startDate),
        this.csv(e.endDate),
        e.allDay ? 'Yes' : 'No',
        this.csv(e.startTime || ''),
        this.csv(e.endTime || ''),
        this.csv(this.audienceLabel(e)),
        this.csv(e.location || '')
      ].join(','))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-calendar-${this.dashboard?.name || 'events'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  printCalendar(): void {
    window.print();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.page = 1;
    this.reload();
  }

  clearType(): void {
    this.typeFilter = null;
    this.page = 1;
    this.reload();
  }

  clearStatus(): void {
    this.statusFilter = null;
    this.page = 1;
    this.reload();
  }

  clearAudience(): void {
    this.audienceFilter = null;
    this.page = 1;
    this.reload();
  }

  clearFrom(): void {
    this.fromDate = '';
    this.page = 1;
    this.reload();
  }

  clearTo(): void {
    this.toDate = '';
    this.page = 1;
    this.reload();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = null;
    this.statusFilter = null;
    this.audienceFilter = null;
    this.fromDate = '';
    this.toDate = '';
    this.page = 1;
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    const initial = !this.dashboard;
    if (initial) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }
    this.api
      .getDashboard(this.selectedYearId, {
        q: this.searchTerm.trim() || undefined,
        eventType: this.typeFilter,
        status: this.statusFilter,
        audienceType: this.audienceFilter,
        from: this.fromDate || null,
        to: this.toDate || null
      })
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
          if (this.page > this.totalPages) {
            this.page = this.totalPages;
          }
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load calendar',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  private loadClassOptions(yearId: number): void {
    this.classesApi.getDashboard(yearId, { active: true }).subscribe({
      next: (dash) => {
        const classes = dash.classes || [];
        this.classOptions = classes.map((c) => ({
          label: c.name,
          value: c.classId
        }));
        this.sectionOptions = classes.flatMap((c) =>
          (c.sections || [])
            .filter((s) => s.active !== false)
            .map((s) => ({
              label: `${c.name} - ${s.name}`,
              value: s.sectionId
            }))
        );
        this.cdr.markForCheck();
      },
      error: () => {
        this.classOptions = [];
        this.sectionOptions = [];
        this.cdr.markForCheck();
      }
    });
  }

  openCreateEvent(prefillDate?: string): void {
    this.editingEventId = null;
    this.editingStatus = null;
    const day = prefillDate || '';
    this.eventForm.reset({
      title: '',
      eventType: 'SCHOOL_EVENT',
      description: '',
      startDate: day,
      endDate: day,
      allDay: true,
      startTime: '',
      endTime: '',
      location: '',
      audienceType: 'EVERYONE',
      classIds: [],
      sectionIds: []
    });
    this.showEventDialog = true;
  }

  openEditEvent(event: AcademicCalendarEventDto): void {
    this.editingEventId = event.eventId;
    this.editingStatus = event.status;
    this.eventForm.reset({
      title: event.title,
      eventType: event.eventType,
      description: event.description || '',
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      startTime: this.toTimeInput(event.startTime),
      endTime: this.toTimeInput(event.endTime),
      location: event.location || '',
      audienceType: event.audienceType,
      classIds: (event.classes || []).map((c) => c.classId),
      sectionIds: (event.sections || []).map((s) => s.sectionId)
    });
    this.showEventDialog = true;
  }

  saveDraft(): void {
    this.persistEvent(false);
  }

  saveEvent(): void {
    this.persistEvent(false);
  }

  publishFromForm(): void {
    if (!this.canManage || this.eventForm.invalid || !this.validateAudience()) {
      this.eventForm.markAllAsTouched();
      return;
    }
    this.confirm.confirm({
      header: 'Publish event?',
      message: 'This event will be visible according to its audience settings.',
      acceptLabel: 'Publish',
      accept: () => this.persistEvent(true)
    });
  }

  private persistEvent(publish: boolean): void {
    if (!this.selectedYearId || this.eventForm.invalid || !this.canManage || !this.validateAudience()) {
      this.eventForm.markAllAsTouched();
      return;
    }
    const body = this.buildRequest(publish);
    this.saving = true;
    const req$ = this.editingEventId
      ? this.api.update(this.editingEventId, body)
      : this.api.create(body);

    req$.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showEventDialog = false;
        this.messages.add({
          severity: 'success',
          summary: this.editingEventId
            ? (publish ? 'Event published' : 'Event updated')
            : (publish ? 'Event published' : 'Draft saved')
        });
        this.reload();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to save event'
      })
    });
  }

  private validateAudience(): boolean {
    const audience = this.eventForm.value.audienceType;
    if (audience === 'CLASS' && !(this.eventForm.value.classIds?.length)) {
      this.messages.add({ severity: 'warn', summary: 'Select at least one class' });
      return false;
    }
    if (audience === 'SECTION' && !(this.eventForm.value.sectionIds?.length)) {
      this.messages.add({ severity: 'warn', summary: 'Select at least one section' });
      return false;
    }
    if (!this.eventForm.value.allDay) {
      if (!this.eventForm.value.startTime || !this.eventForm.value.endTime) {
        this.messages.add({ severity: 'warn', summary: 'Start and end time are required' });
        return false;
      }
    }
    return true;
  }

  private buildRequest(publish: boolean): AcademicCalendarEventRequest {
    const value = this.eventForm.getRawValue();
    const allDay = !!value.allDay;
    return {
      academicYearId: this.selectedYearId!,
      title: value.title!.trim(),
      description: value.description?.trim() || undefined,
      eventType: value.eventType!,
      startDate: value.startDate!,
      endDate: value.endDate!,
      allDay,
      startTime: allDay ? null : this.toApiTime(value.startTime),
      endTime: allDay ? null : this.toApiTime(value.endTime),
      location: value.location?.trim() || undefined,
      audienceType: value.audienceType!,
      classIds: value.audienceType === 'CLASS' ? (value.classIds || []) : undefined,
      sectionIds: value.audienceType === 'SECTION' ? (value.sectionIds || []) : undefined,
      publish: publish || undefined
    };
  }

  openDetails(eventId: number): void {
    void this.router.navigate(
      ['/app/academics/academic-calendar', eventId],
      { queryParams: { from: 'calendar' } }
    );
  }

  buildMenu(event: AcademicCalendarEventDto): void {
    const items: MenuItem[] = [
      {
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.openDetails(event.eventId)
      }
    ];

    if (this.canManage) {
      items.push({
        label: 'Edit Event',
        icon: 'pi pi-pencil',
        command: () => this.openEditEvent(event)
      });

      if (event.status === 'DRAFT') {
        items.push({
          label: 'Publish',
          icon: 'pi pi-send',
          command: () => this.publishEvent(event)
        });
      }
      if (event.status === 'PUBLISHED') {
        items.push({
          label: 'Unpublish',
          icon: 'pi pi-eye-slash',
          command: () => this.unpublishEvent(event)
        });
      }
      if (event.status !== 'INACTIVE') {
        items.push({
          label: 'Deactivate',
          icon: 'pi pi-ban',
          command: () => this.deactivateEvent(event)
        });
      } else {
        items.push({
          label: 'Reactivate',
          icon: 'pi pi-check',
          command: () => this.reactivateEvent(event)
        });
      }
    }

    this.menuItems = items;
  }

  publishEvent(event: AcademicCalendarEventDto): void {
    if (!this.canManage) return;
    this.confirm.confirm({
      header: `Publish ${event.title}?`,
      message: 'This event will become visible to its audience.',
      acceptLabel: 'Publish',
      accept: () => {
        this.api.publish(event.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event published' });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Publish failed',
            detail: err?.error?.message || 'Unable to publish event'
          })
        });
      }
    });
  }

  unpublishEvent(event: AcademicCalendarEventDto): void {
    if (!this.canManage) return;
    this.confirm.confirm({
      header: `Unpublish ${event.title}?`,
      message: 'The event will return to draft and no longer be publicly visible.',
      acceptLabel: 'Unpublish',
      accept: () => {
        this.api.unpublish(event.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event unpublished' });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Unpublish failed',
            detail: err?.error?.message || 'Unable to unpublish event'
          })
        });
      }
    });
  }

  deactivateEvent(event: AcademicCalendarEventDto): void {
    if (!this.canManage) return;
    this.confirm.confirm({
      header: `Deactivate ${event.title}?`,
      message: 'This event will be marked inactive.',
      acceptLabel: 'Deactivate',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deactivate(event.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event deactivated' });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Action failed',
            detail: err?.error?.message || 'Unable to deactivate event'
          })
        });
      }
    });
  }

  reactivateEvent(event: AcademicCalendarEventDto): void {
    if (!this.canManage) return;
    this.confirm.confirm({
      header: `Reactivate ${event.title}?`,
      message: 'This event will become active again as a draft.',
      acceptLabel: 'Reactivate',
      accept: () => {
        this.api.reactivate(event.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event reactivated' });
            this.reload();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Action failed',
            detail: err?.error?.message || 'Unable to reactivate event'
          })
        });
      }
    });
  }

  typeLabel(type: CalendarEventType): string {
    return CALENDAR_EVENT_TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
  }

  typeTone(type: CalendarEventType): string {
    switch (type) {
      case 'HOLIDAY': return 'holiday';
      case 'EXAMINATION': return 'exam';
      case 'SCHOOL_EVENT': return 'school';
      case 'ACADEMIC_EVENT': return 'academic';
      default: return 'default';
    }
  }

  statusLabel(status: CalendarEventStatus): string {
    return CALENDAR_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
  }

  audienceLabel(event: AcademicCalendarEventDto): string {
    if (event.audienceType === 'EVERYONE') return 'Everyone';
    if (event.audienceType === 'CLASS') {
      const names = (event.classes || []).map((c) => c.name).filter(Boolean);
      return names.length ? names.join(', ') : 'Specific classes';
    }
    const names = (event.sections || []).map((s) =>
      s.className ? `${s.className} - ${s.name}` : s.name
    ).filter(Boolean);
    return names.length ? names.join(', ') : 'Specific sections';
  }

  audienceFilterLabel(type: CalendarAudienceType): string {
    return CALENDAR_AUDIENCE_OPTIONS.find((a) => a.value === type)?.label || type;
  }

  formatDateRange(event: AcademicCalendarEventDto): string {
    const start = this.formatDate(event.startDate);
    const end = this.formatDate(event.endDate);
    if (!start) return '—';
    if (!end || start === end) return start;
    return `${start} – ${end}`;
  }

  formatTimeDisplay(event: AcademicCalendarEventDto): string {
    if (event.allDay) return 'All day';
    const start = this.formatTime(event.startTime);
    const end = this.formatTime(event.endTime);
    if (start && end) return `${start} – ${end}`;
    return start || end || '—';
  }

  formatDate(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value + (value.length <= 10 ? 'T00:00:00' : ''));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(value?: string | null): string {
    if (!value) return '';
    const parts = value.split(':');
    if (parts.length < 2) return value;
    const h = Number(parts[0]);
    const m = parts[1];
    if (Number.isNaN(h)) return value;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
  }

  upcomingDay(event: AcademicCalendarEventDto): string {
    const d = new Date(event.startDate + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '';
    return String(d.getDate());
  }

  upcomingMonth(event: AcademicCalendarEventDto): string {
    const d = new Date(event.startDate + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  }

  trackByDateKey(_: number, cell: AcademicCalendarDayCell): string {
    return cell.dateKey;
  }

  private buildMonthCells(monthStart: Date, events: AcademicCalendarEventDto[]): AcademicCalendarDayCell[] {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const first = new Date(year, month, 1);
    // Monday-based: Mon=0 … Sun=6
    const mondayIndex = (first.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayIndex);
    const todayKey = this.toDateKey(new Date());
    const cells: AcademicCalendarDayCell[] = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const dateKey = this.toDateKey(d);
      const inMonth = d.getMonth() === month;
      cells.push({
        dateKey,
        day: d.getDate(),
        inMonth,
        isToday: dateKey === todayKey,
        isSunday: d.getDay() === 0,
        events: inMonth ? this.eventsOnDate(events, dateKey) : []
      });
    }

    // Drop trailing (and leading) weeks that are entirely outside the month.
    // Keep 5 weeks when possible; use 6 only when the month actually spans 6 weeks.
    while (cells.length > 28) {
      const trailing = cells.slice(-7);
      if (trailing.every((c) => !c.inMonth)) {
        cells.splice(-7, 7);
        continue;
      }
      break;
    }
    while (cells.length > 28) {
      const leading = cells.slice(0, 7);
      if (leading.every((c) => !c.inMonth)) {
        cells.splice(0, 7);
        continue;
      }
      break;
    }

    return cells;
  }

  private eventsOnDate(events: AcademicCalendarEventDto[], dateKey: string): AcademicCalendarEventDto[] {
    return events
      .filter((e) => e.startDate <= dateKey && e.endDate >= dateKey && e.status !== 'INACTIVE')
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private csv(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
  }

  private toTimeInput(value?: string | null): string {
    if (!value) return '';
    const parts = value.split(':');
    if (parts.length < 2) return value;
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  private toApiTime(value?: string | null): string | null {
    if (!value?.trim()) return null;
    const parts = value.trim().split(':');
    if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    if (parts.length >= 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    return value;
  }
}
