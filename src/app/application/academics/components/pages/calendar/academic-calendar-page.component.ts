import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicsActionMode, AcademicsWorkspaceData, AcademicCalendarEventModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { ACADEMICS_EVENT_TYPES, ACADEMICS_EVENT_COLORS } from '../../../data/academics-workspace.config';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-academic-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, CalendarModule, ToastModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calendar-page">
      <!-- Header -->
      <div class="calendar-header">
        <div>
          <div class="calendar-eyebrow">Academic Calendar</div>
          <h1 class="calendar-title">Planning Calendar</h1>
        </div>
        <div class="calendar-actions">
          <div class="calendar-view-tabs">
            <button class="calendar-view-tab" [class.active]="viewMode === 'month'" (click)="viewMode = 'month'">Month</button>
            <button class="calendar-view-tab" [class.active]="viewMode === 'week'" (click)="viewMode = 'week'">Week</button>
            <button class="calendar-view-tab" [class.active]="viewMode === 'agenda'" (click)="viewMode = 'agenda'">Agenda</button>
          </div>
          <button class="calendar-btn calendar-btn-primary" (click)="openCreateEventDialog()">
            <i class="pi pi-calendar-plus"></i> Create Event
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="calendar-content">
        <!-- Calendar View -->
        <div class="calendar-view-panel">
          <!-- Month View -->
          <div class="calendar-month-view" *ngIf="viewMode === 'month'">
            <div class="calendar-month-header">
              <button class="calendar-nav-btn" (click)="prevMonth()"><i class="pi pi-chevron-left"></i></button>
              <h2>{{ currentMonthName }} {{ currentYear }}</h2>
              <button class="calendar-nav-btn" (click)="nextMonth()"><i class="pi pi-chevron-right"></i></button>
            </div>
            <div class="calendar-weekdays">
              <span *ngFor="let day of weekdays">{{ day }}</span>
            </div>
            <div class="calendar-days-grid">
              <div class="calendar-day" *ngFor="let day of monthDays"
                [class.other-month]="day.otherMonth"
                [class.today]="day.isToday"
                (click)="selectDate(day.date)">
                <span class="calendar-day-number">{{ day.dayNumber }}</span>
                <div class="calendar-day-events">
                  <div class="calendar-day-event" *ngFor="let event of day.events"
                    [style.background]="getEventColor(event.eventType)"
                    [pTooltip]="event.title || ''">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Week View -->
          <div class="calendar-week-view" *ngIf="viewMode === 'week'">
            <div class="calendar-week-header">
              <button class="calendar-nav-btn" (click)="prevWeek()"><i class="pi pi-chevron-left"></i></button>
              <h2>{{ weekRangeText }}</h2>
              <button class="calendar-nav-btn" (click)="nextWeek()"><i class="pi pi-chevron-right"></i></button>
            </div>
            <div class="calendar-week-grid">
              <div class="calendar-week-day" *ngFor="let day of weekDays">
                <div class="calendar-week-day-header">{{ day.dayName }}<br><strong>{{ day.dayNumber }}</strong></div>
                <div class="calendar-week-day-events">
                  <div class="calendar-week-event" *ngFor="let event of day.events"
                    [style.borderLeftColor]="getEventColor(event.eventType)"
                    (click)="openEditEventDialog(event)">
                    <span class="calendar-week-event-time">{{ event.startDate | date:'HH:mm' }}</span>
                    <span class="calendar-week-event-title">{{ event.title }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Agenda View -->
          <div class="calendar-agenda-view" *ngIf="viewMode === 'agenda'">
            <div class="calendar-agenda-list">
              <div class="calendar-agenda-item" *ngFor="let event of sortedEvents">
                <div class="calendar-agenda-date">
                  <strong>{{ event.startDate | date:'dd' }}</strong>
                  <span>{{ event.startDate | date:'MMM' }}</span>
                </div>
                <div class="calendar-agenda-details">
                  <span class="calendar-agenda-type" [style.background]="getEventColor(event.eventType)">{{ event.eventType }}</span>
                  <strong>{{ event.title }}</strong>
                  <span>{{ event.startDate | date:'mediumDate' }} {{ event.endDate ? '- ' + (event.endDate | date:'mediumDate') : '' }}</span>
                  <span *ngIf="event.location">{{ event.location }}</span>
                </div>
                <div class="calendar-agenda-actions">
                  <button class="calendar-icon-btn" (click)="openEditEventDialog(event)"><i class="pi pi-pencil"></i></button>
                  <button class="calendar-icon-btn" (click)="confirmDeleteEvent(event)"><i class="pi pi-trash"></i></button>
                </div>
              </div>
              <div class="calendar-agenda-empty" *ngIf="!sortedEvents.length">
                <i class="pi pi-calendar"></i>
                <p>No events scheduled. Create your first event.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Events Sidebar -->
        <div class="calendar-sidebar">
          <div class="calendar-sidebar-header">
            <i class="pi pi-calendar-clock"></i>
            <span>Upcoming Events</span>
          </div>
          <div class="calendar-sidebar-list">
            <div class="calendar-sidebar-event" *ngFor="let event of upcomingEvents">
              <div class="calendar-sidebar-event-dot" [style.background]="getEventColor(event.eventType)"></div>
              <div class="calendar-sidebar-event-details">
                <strong>{{ event.title }}</strong>
                <small>{{ event.startDate | date:'MMM dd, yyyy' }}</small>
              </div>
            </div>
            <div class="calendar-sidebar-empty" *ngIf="!upcomingEvents.length">
              <p>No upcoming events</p>
            </div>
          </div>
          <div class="calendar-legend">
            <div class="calendar-legend-item" *ngFor="let type of eventTypes">
              <span class="calendar-legend-dot" [style.background]="getEventColor(type)"></span>
              <span>{{ type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Event Dialog -->
    <p-dialog header="{{ editingEvent ? 'Edit Event' : 'Create Event' }}" [(visible)]="showEventDialog" [modal]="true" [style]="{width: '800px'}" [draggable]="false" [resizable]="false">
      <div class="calendar-dialog-form">
        <div class="calendar-form-row">
          <label>Event Type <span class="required">*</span></label>
          <p-dropdown [options]="eventTypeOptions" [(ngModel)]="eventForm.eventType" optionLabel="label" optionValue="value" placeholder="Select Type" styleClass="calendar-form-dropdown"></p-dropdown>
        </div>
        <div class="calendar-form-row">
          <label>Title <span class="required">*</span></label>
          <input pInputText [(ngModel)]="eventForm.title" placeholder="e.g., Annual Day" class="calendar-form-input">
        </div>
        <div class="calendar-form-row">
          <label>Start Date <span class="required">*</span></label>
          <p-calendar [(ngModel)]="eventForm.startDate" [showTime]="true" hourFormat="24" [iconDisplay]="'input'" [showIcon]="true" styleClass="calendar-form-datepicker"></p-calendar>
        </div>
        <div class="calendar-form-row">
          <label>End Date</label>
          <p-calendar [(ngModel)]="eventForm.endDate" [showTime]="true" hourFormat="24" [iconDisplay]="'input'" [showIcon]="true" styleClass="calendar-form-datepicker"></p-calendar>
        </div>
        <div class="calendar-form-row">
          <label>Location</label>
          <input pInputText [(ngModel)]="eventForm.location" placeholder="e.g., Auditorium" class="calendar-form-input">
        </div>
        <div class="calendar-form-row">
          <label>Audience</label>
          <p-dropdown [options]="audienceOptions" [(ngModel)]="eventForm.audience" placeholder="Select Audience" styleClass="calendar-form-dropdown"></p-dropdown>
        </div>
        <div class="calendar-form-row">
          <label>Description</label>
          <textarea pInputTextarea [(ngModel)]="eventForm.description" rows="3" placeholder="Event description..." class="calendar-form-input"></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="calendar-btn calendar-btn-ghost" (click)="showEventDialog = false">Cancel</button>
        <button class="calendar-btn calendar-btn-danger" *ngIf="editingEvent" (click)="confirmDeleteEvent(editingEvent)">Delete</button>
        <button class="calendar-btn calendar-btn-primary" (click)="saveEvent()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-confirmDialog [style]="{width: '500px'}"></p-confirmDialog>
    <p-toast position="top-right"></p-toast>
  `,
  styles: [`
    :host { display: block; }
    .calendar-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.25rem; }
    .calendar-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .calendar-eyebrow { font-size: 0.8rem; color: var(--tc-text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .calendar-title { font-size: 1.5rem; font-weight: 700; color: var(--tc-heading); margin: 0.25rem 0 0; }
    .calendar-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .calendar-view-tabs { display: flex; background: var(--tc-bg-muted); border-radius: 8px; padding: 0.2rem; }
    .calendar-view-tab { padding: 0.4rem 0.85rem; border: none; background: transparent; color: var(--tc-text-muted); font-size: 0.85rem; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
    .calendar-view-tab.active { background: var(--tc-surface-card); color: var(--tc-heading); font-weight: 600; }
    .calendar-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .calendar-btn-primary { background: var(--tc-primary-600); color: #fff; border-color: var(--tc-primary-600); }
    .calendar-btn-ghost { background: transparent; color: var(--tc-text-muted); border-color: transparent; }
    .calendar-btn-ghost:hover { background: var(--tc-bg-muted); }
    .calendar-btn-danger { background: #EF4444; color: #fff; }
    .calendar-content { display: grid; grid-template-columns: 1fr 300px; gap: 1rem; }
    .calendar-view-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: hidden; }
    .calendar-month-view { padding: 1rem; }
    .calendar-month-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .calendar-month-header h2 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    .calendar-nav-btn { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--tc-border); background: transparent; color: var(--tc-text); cursor: pointer; }
    .calendar-nav-btn:hover { background: var(--tc-bg-muted); }
    .calendar-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-weight: 600; font-size: 0.8rem; color: var(--tc-text-muted); margin-bottom: 0.5rem; }
    .calendar-weekdays span { padding: 0.5rem; }
    .calendar-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .calendar-day { min-height: 80px; padding: 0.35rem; border-radius: 6px; background: var(--tc-bg); cursor: pointer; transition: background 0.2s; }
    .calendar-day:hover { background: var(--tc-bg-muted); }
    .calendar-day.other-month { opacity: 0.4; }
    .calendar-day.today { background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); }
    .calendar-day-number { font-size: 0.8rem; font-weight: 600; color: var(--tc-text); }
    .calendar-day-events { display: flex; flex-direction: column; gap: 2px; margin-top: 0.25rem; }
    .calendar-day-event { height: 4px; border-radius: 2px; }
    .calendar-week-view { padding: 1rem; }
    .calendar-week-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .calendar-week-header h2 { margin: 0; font-size: 1.1rem; }
    .calendar-week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .calendar-week-day { min-height: 200px; border: 1px solid var(--tc-border); border-radius: 8px; overflow: hidden; }
    .calendar-week-day-header { text-align: center; padding: 0.5rem; background: var(--tc-bg-muted); font-size: 0.8rem; }
    .calendar-week-day-events { padding: 0.35rem; display: flex; flex-direction: column; gap: 4px; }
    .calendar-week-event { padding: 0.35rem; border-radius: 4px; border-left: 3px solid; background: var(--tc-bg); cursor: pointer; font-size: 0.75rem; }
    .calendar-week-event-time { display: block; font-weight: 600; }
    .calendar-week-event-title { display: block; color: var(--tc-text-muted); }
    .calendar-agenda-view { padding: 1rem; }
    .calendar-agenda-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .calendar-agenda-item { display: grid; grid-template-columns: 50px 1fr auto; gap: 0.75rem; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--tc-border); align-items: center; }
    .calendar-agenda-date { text-align: center; }
    .calendar-agenda-date strong { display: block; font-size: 1.25rem; }
    .calendar-agenda-date span { font-size: 0.75rem; color: var(--tc-text-muted); }
    .calendar-agenda-details { display: flex; flex-direction: column; gap: 0.2rem; }
    .calendar-agenda-type { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; color: #fff; font-weight: 600; width: fit-content; }
    .calendar-agenda-details strong { font-size: 0.9rem; }
    .calendar-agenda-details span { font-size: 0.8rem; color: var(--tc-text-muted); }
    .calendar-agenda-actions { display: flex; gap: 0.35rem; }
    .calendar-icon-btn { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--tc-border); background: transparent; color: var(--tc-text-muted); cursor: pointer; }
    .calendar-icon-btn:hover { background: var(--tc-bg-muted); }
    .calendar-agenda-empty { text-align: center; padding: 3rem 1rem; color: var(--tc-text-muted); }
    .calendar-agenda-empty i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.5; }
    .calendar-sidebar { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .calendar-sidebar-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-bottom: 1px solid var(--tc-border); font-weight: 600; }
    .calendar-sidebar-list { flex: 1; overflow: auto; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .calendar-sidebar-event { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 6px; background: var(--tc-bg); }
    .calendar-sidebar-event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .calendar-sidebar-event-details strong { display: block; font-size: 0.85rem; }
    .calendar-sidebar-event-details small { color: var(--tc-text-muted); }
    .calendar-sidebar-empty { text-align: center; padding: 2rem; color: var(--tc-text-muted); }
    .calendar-legend { padding: 0.75rem 1rem; border-top: 1px solid var(--tc-border); display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .calendar-legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--tc-text-muted); }
    .calendar-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .calendar-dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .calendar-form-row { display: flex; flex-direction: column; gap: 0.35rem; }
    .calendar-form-row label { font-size: 0.85rem; font-weight: 500; color: var(--tc-text); }
    .required { color: #EF4444; }
    .calendar-form-input { padding: 0.6rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); }
    .calendar-form-input:focus { outline: none; border-color: var(--tc-primary-600); }
    .calendar-form-dropdown { width: 100%; }
    .calendar-form-datepicker { width: 100%; }
    @media (max-width: 1024px) { .calendar-content { grid-template-columns: 1fr; } }
  `]
})
export class AcademicCalendarPageComponent implements OnInit {
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();
  @Output() dataChanged = new EventEmitter<void>();

  viewMode: 'month' | 'week' | 'agenda' = 'month';
  showEventDialog = false;
  editingEvent: AcademicCalendarEventModel | null = null;
  saving = false;

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  currentWeekStart = this.getWeekStart(this.currentDate);

  eventForm: any = { eventType: null, title: '', startDate: null, endDate: null, location: '', audience: '', description: '' };

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly eventTypes = ACADEMICS_EVENT_TYPES;
  readonly eventTypeOptions = ACADEMICS_EVENT_TYPES.map(t => ({ label: t.charAt(0) + t.slice(1).toLowerCase(), value: t }));
  readonly audienceOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'Teachers', value: 'TEACHERS' },
    { label: 'Students', value: 'STUDENTS' },
    { label: 'Parents', value: 'PARENTS' }
  ];

  ngOnInit() {}

  get currentMonthName() {
    return new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long' });
  }

  get monthDays() {
    const days: any[] = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const today = new Date();

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth - 1, daysInPrevMonth - i);
      days.push({ dayNumber: daysInPrevMonth - i, otherMonth: true, isToday: false, date, events: this.getEventsForDate(date) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      days.push({ dayNumber: i, otherMonth: false, isToday: date.toDateString() === today.toDateString(), date, events: this.getEventsForDate(date) });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, i);
      days.push({ dayNumber: i, otherMonth: true, isToday: false, date, events: this.getEventsForDate(date) });
    }
    return days;
  }

  get weekDays() {
    const days: any[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push({
        dayName: this.weekdays[date.getDay()],
        dayNumber: date.getDate(),
        date,
        events: this.getEventsForDate(date)
      });
    }
    return days;
  }

  get weekRangeText() {
    const start = this.weekDays[0]?.date;
    const end = this.weekDays[6]?.date;
    if (!start || !end) return '';
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  get sortedEvents() {
    return [...this.data.calendarEvents].sort((a, b) => {
      const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aDate - bDate;
    });
  }

  get upcomingEvents() {
    const now = new Date();
    return this.data.calendarEvents
      .filter(e => e.startDate && new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
      .slice(0, 10);
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getEventsForDate(date: Date): AcademicCalendarEventModel[] {
    return this.data.calendarEvents.filter(e => {
      if (!e.startDate) return false;
      const eventDate = new Date(e.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  getEventColor(eventType?: string): string {
    return ACADEMICS_EVENT_COLORS[eventType || 'OTHER'] || '#64748B';
  }

  prevMonth() { this.currentMonth--; if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; } }
  nextMonth() { this.currentMonth++; if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; } }
  prevWeek() { this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7); this.currentWeekStart = new Date(this.currentWeekStart); }
  nextWeek() { this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7); this.currentWeekStart = new Date(this.currentWeekStart); }
  selectDate(date: Date) { this.currentDate = date; this.viewMode = 'agenda'; }

  openCreateEventDialog() {
    this.editingEvent = null;
    this.eventForm = { eventType: null, title: '', startDate: null, endDate: null, location: '', audience: '', description: '' };
    this.showEventDialog = true;
  }

  openEditEventDialog(event: AcademicCalendarEventModel) {
    this.editingEvent = event;
    this.eventForm = {
      eventType: event.eventType,
      title: event.title,
      startDate: event.startDate ? new Date(event.startDate) : null,
      endDate: event.endDate ? new Date(event.endDate) : null,
      location: event.location || '',
      audience: event.audience || '',
      description: event.description || ''
    };
    this.showEventDialog = true;
  }

  saveEvent() {
    if (!this.eventForm.eventType || !this.eventForm.title || !this.eventForm.startDate) return;
    this.saving = true;
    const payload = {
      eventType: this.eventForm.eventType,
      title: this.eventForm.title,
      startDate: this.eventForm.startDate instanceof Date ? this.eventForm.startDate.toISOString() : this.eventForm.startDate,
      endDate: this.eventForm.endDate instanceof Date ? this.eventForm.endDate.toISOString() : this.eventForm.endDate,
      location: this.eventForm.location,
      audience: this.eventForm.audience,
      description: this.eventForm.description
    };
    const obs = this.editingEvent
      ? this.workspaceService.updateCalendarEvent(Number(this.editingEvent.eventId), payload)
      : this.workspaceService.createCalendarEvent(payload);

    obs.pipe(finalize(() => { this.saving = false; this.showEventDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: this.editingEvent ? 'Event updated' : 'Event created' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  confirmDeleteEvent(event: AcademicCalendarEventModel) {
    this.confirmationService.confirm({
      message: `Delete event "${event.title}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.deleteCalendarEvent(Number(event.eventId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deleted' }); this.showEventDialog = false; this.dataChanged.emit(); } });
      }
    });
  }
}