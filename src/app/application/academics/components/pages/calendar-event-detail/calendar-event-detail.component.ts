import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
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
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { AcademicCalendarApiService } from '../../../services/academic-calendar-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import {
  ACADEMICS_CALENDAR_RESOURCE,
  AcademicCalendarEventDto,
  AcademicCalendarEventRequest,
  CALENDAR_AUDIENCE_OPTIONS,
  CALENDAR_EVENT_TYPE_OPTIONS,
  CALENDAR_STATUS_OPTIONS,
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventType
} from '../../../models/academic-calendar.model';

@Component({
  selector: 'app-calendar-event-detail-page',
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
  templateUrl: './calendar-event-detail.component.html',
  styleUrls: ['./calendar-event-detail.component.scss']
})
export class CalendarEventDetailPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(AcademicCalendarApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly nav = inject(AcademicsNavService);
  private readonly pageHeader = inject(BreadCrumbService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_CALENDAR_RESOURCE;
  readonly eventTypeOptions = CALENDAR_EVENT_TYPE_OPTIONS;
  readonly audienceOptions = CALENDAR_AUDIENCE_OPTIONS;

  loading = true;
  loadError = false;
  saving = false;
  event: AcademicCalendarEventDto | null = null;
  private eventId: number | null = null;
  showEventDialog = false;
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

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.event?.yearReadOnly;
  }

  get isEditingPublished(): boolean {
    return this.event?.status === 'PUBLISHED';
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('eventId'));
      if (id) {
        this.eventId = id;
        this.load(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  back(): void {
    this.nav.back(this.route, ['/app/academics/academic-calendar']);
  }

  retry(): void {
    if (this.eventId) this.load(this.eventId);
  }

  load(eventId: number): void {
    this.loading = true;
    this.loadError = false;
    this.api.getById(eventId).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (event) => {
        this.event = event;
        this.pageHeader.setPageHeader({
          title: event.title,
          subtitle: this.formatDateRange(event)
        });
        this.loadClassOptions(event.academicYearId);
      },
      error: () => {
        this.event = null;
        this.loadError = true;
      }
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
      }
    });
  }

  openEditEvent(): void {
    if (!this.event) return;
    this.eventForm.reset({
      title: this.event.title,
      eventType: this.event.eventType,
      description: this.event.description || '',
      startDate: this.event.startDate,
      endDate: this.event.endDate,
      allDay: this.event.allDay,
      startTime: this.toTimeInput(this.event.startTime),
      endTime: this.toTimeInput(this.event.endTime),
      location: this.event.location || '',
      audienceType: this.event.audienceType,
      classIds: (this.event.classes || []).map((c) => c.classId),
      sectionIds: (this.event.sections || []).map((s) => s.sectionId)
    });
    this.showEventDialog = true;
  }

  saveEvent(): void {
    if (!this.event || this.eventForm.invalid || !this.canManage || !this.validateAudience()) {
      this.eventForm.markAllAsTouched();
      return;
    }
    const body = this.buildRequest(false);
    this.saving = true;
    this.api.update(this.event.eventId, body).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showEventDialog = false;
        this.messages.add({ severity: 'success', summary: 'Event updated' });
        this.load(this.event!.eventId);
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: err?.error?.message || 'Unable to update event'
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
      academicYearId: this.event!.academicYearId,
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

  buildHeaderMenu(): void {
    if (!this.event || !this.canManage) {
      this.menuItems = [];
      return;
    }
    const event = this.event;
    const items: MenuItem[] = [];

    if (event.status === 'DRAFT') {
      items.push({
        label: 'Publish',
        icon: 'pi pi-send',
        command: () => this.publishEvent()
      });
    }
    if (event.status === 'PUBLISHED') {
      items.push({
        label: 'Unpublish',
        icon: 'pi pi-eye-slash',
        command: () => this.unpublishEvent()
      });
    }
    if (event.status !== 'INACTIVE') {
      items.push({
        label: 'Deactivate',
        icon: 'pi pi-ban',
        command: () => this.deactivateEvent()
      });
    } else {
      items.push({
        label: 'Reactivate',
        icon: 'pi pi-check',
        command: () => this.reactivateEvent()
      });
    }

    this.menuItems = items;
  }

  publishEvent(): void {
    if (!this.event || !this.canManage) return;
    this.confirm.confirm({
      header: `Publish ${this.event.title}?`,
      message: 'This event will become visible to its audience.',
      acceptLabel: 'Publish',
      accept: () => {
        this.api.publish(this.event!.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event published' });
            this.load(this.event!.eventId);
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

  unpublishEvent(): void {
    if (!this.event || !this.canManage) return;
    this.confirm.confirm({
      header: `Unpublish ${this.event.title}?`,
      message: 'The event will return to draft and no longer be publicly visible.',
      acceptLabel: 'Unpublish',
      accept: () => {
        this.api.unpublish(this.event!.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event unpublished' });
            this.load(this.event!.eventId);
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

  deactivateEvent(): void {
    if (!this.event || !this.canManage) return;
    this.confirm.confirm({
      header: `Deactivate ${this.event.title}?`,
      message: 'This event will be marked inactive.',
      acceptLabel: 'Deactivate',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deactivate(this.event!.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event deactivated' });
            this.load(this.event!.eventId);
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

  reactivateEvent(): void {
    if (!this.event || !this.canManage) return;
    this.confirm.confirm({
      header: `Reactivate ${this.event.title}?`,
      message: 'This event will become active again as a draft.',
      acceptLabel: 'Reactivate',
      accept: () => {
        this.api.reactivate(this.event!.eventId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Event reactivated' });
            this.load(this.event!.eventId);
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

  statusLabel(status: CalendarEventStatus): string {
    return CALENDAR_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
  }

  appliesToLabel(event: AcademicCalendarEventDto): string {
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

  formatDateTime(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
