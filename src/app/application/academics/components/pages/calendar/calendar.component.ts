import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicsWorkspaceData, AcademicCalendarEventModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { ACADEMICS_EVENT_TYPES, ACADEMICS_EVENT_COLORS } from '../../../data/academics-workspace.config';

@Component({
  selector: 'app-academic-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, CalendarModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class AcademicCalendarPageComponent implements OnInit {
  private readonly ws = inject(AcademicsWorkspaceService);
  private readonly cs = inject(ConfirmationService);
  private readonly ms = inject(MessageService);
  private readonly dr = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() dataChanged = new EventEmitter<void>();

  viewMode: 'month' | 'week' | 'agenda' = 'month';
  showDialog = false;
  editingEvent: AcademicCalendarEventModel | null = null;
  saving = false;

  filterYearId: any = null;
  filterEventType: any = null;

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  currentWeekStart = this.getWeekStart(this.currentDate);
  formModel: any = {};

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly eventTypes = ACADEMICS_EVENT_TYPES;
  readonly eventTypeOptions = ACADEMICS_EVENT_TYPES.map(t => ({ label: t.charAt(0) + t.slice(1).toLowerCase(), value: t }));
  readonly audienceOptions = [
    { label: 'All', value: 'ALL' }, { label: 'Teachers', value: 'TEACHERS' },
    { label: 'Students', value: 'STUDENTS' }, { label: 'Parents', value: 'PARENTS' }
  ];
  readonly yearOptions = () => this.data.academicYears.map(y => ({ label: y.yearCode || y.yearName || `Year ${y.academicYearId}`, value: y.academicYearId ?? y.id }));

  ngOnInit() {}

  get filteredEvents() {
    let events = this.data.calendarEvents;
    if (this.filterEventType) events = events.filter(e => e.eventType === this.filterEventType);
    return events;
  }

  get currentMonthName() { return new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long' }); }

  get monthDays() {
    const days: any[] = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const dim = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const dimp = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const today = new Date();
    for (let i = firstDay - 1; i >= 0; i--) days.push({ dayNumber: dimp - i, otherMonth: true, date: new Date(this.currentYear, this.currentMonth - 1, dimp - i), events: this.eventsForDate(new Date(this.currentYear, this.currentMonth - 1, dimp - i)) });
    for (let i = 1; i <= dim; i++) days.push({ dayNumber: i, otherMonth: false, isToday: new Date(this.currentYear, this.currentMonth, i).toDateString() === today.toDateString(), date: new Date(this.currentYear, this.currentMonth, i), events: this.eventsForDate(new Date(this.currentYear, this.currentMonth, i)) });
    for (let i = 1; days.length < 42; i++) days.push({ dayNumber: i, otherMonth: true, date: new Date(this.currentYear, this.currentMonth + 1, i), events: this.eventsForDate(new Date(this.currentYear, this.currentMonth + 1, i)) });
    return days;
  }

  get weekDays() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.currentWeekStart); d.setDate(d.getDate() + i);
      return { dayName: this.weekdays[d.getDay()], dayNumber: d.getDate(), date: d, events: this.eventsForDate(d) };
    });
  }

  get weekRangeText() {
    const s = this.weekDays[0]?.date, e = this.weekDays[6]?.date;
    return s && e ? `${s.toLocaleDateString()} - ${e.toLocaleDateString()}` : '';
  }

  get sortedEvents() { return [...this.filteredEvents].sort((a, b) => (a.startDate ? new Date(a.startDate).getTime() : 0) - (b.startDate ? new Date(b.startDate).getTime() : 0)); }
  get upcomingEvents() { const n = new Date(); return this.filteredEvents.filter(e => e.startDate && new Date(e.startDate) >= n).sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()).slice(0, 10); }
  get pastEvents() { const n = new Date(); return this.filteredEvents.filter(e => e.startDate && new Date(e.startDate) < n).sort((a, b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime()).slice(0, 10); }

  private getWeekStart(d: Date) { const dt = new Date(d); dt.setDate(dt.getDate() - dt.getDay()); dt.setHours(0, 0, 0, 0); return dt; }
  private eventsForDate(date: Date) { return this.filteredEvents.filter(e => e.startDate && new Date(e.startDate).toDateString() === date.toDateString()); }
  getEventColor(t?: string) { return ACADEMICS_EVENT_COLORS[t || 'OTHER'] || '#64748B'; }

  prevMonth() { this.currentMonth--; if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; } }
  nextMonth() { this.currentMonth++; if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; } }
  prevWeek() { this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7); this.currentWeekStart = new Date(this.currentWeekStart); }
  nextWeek() { this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7); this.currentWeekStart = new Date(this.currentWeekStart); }
  selectDate(d: Date) { this.currentDate = d; this.viewMode = 'agenda'; }

  openCreateDialog() { this.editingEvent = null; this.formModel = {}; this.showDialog = true; }
  openEditDialog(e: AcademicCalendarEventModel) { this.editingEvent = e; this.formModel = { ...e, startDate: e.startDate ? new Date(e.startDate) : null, endDate: e.endDate ? new Date(e.endDate) : null }; this.showDialog = true; }

  save() {
    if (!this.formModel.eventType || !this.formModel.title || !this.formModel.startDate) return;
    this.saving = true;
    const p = {
      eventType: this.formModel.eventType, title: this.formModel.title,
      startDate: this.formModel.startDate instanceof Date ? this.formModel.startDate.toISOString() : this.formModel.startDate,
      endDate: this.formModel.endDate instanceof Date ? this.formModel.endDate.toISOString() : this.formModel.endDate,
      location: this.formModel.location, audience: this.formModel.audience, description: this.formModel.description
    };
    const obs = this.editingEvent ? this.ws.updateCalendarEvent(Number(this.editingEvent.eventId), p) : this.ws.createCalendarEvent(p);
    obs.pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.dr))
      .subscribe({ next: () => { this.ms.add({ severity: 'success', summary: this.editingEvent ? 'Updated' : 'Created' }); this.dataChanged.emit(); }, error: () => this.ms.add({ severity: 'error', summary: 'Failed' }) });
  }

  delete(e: AcademicCalendarEventModel) {
    this.cs.confirm({ message: `Delete "${e.title}"?`, header: 'Confirm', icon: 'pi pi-exclamation-triangle',
      accept: () => { this.ws.deleteCalendarEvent(Number(e.eventId)).pipe(takeUntilDestroyed(this.dr)).subscribe({ next: () => { this.ms.add({ severity: 'success', summary: 'Deleted' }); this.showDialog = false; this.dataChanged.emit(); } }); }
    });
  }
}