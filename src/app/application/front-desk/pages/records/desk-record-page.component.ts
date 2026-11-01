import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiConfirmService } from '../../../../core/feedback/ui-confirm.service';
import { ListContextService } from '../../../../core/services/list-context.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import {
  AppDateTimeComponent,
  AppEmptyStateComponent,
  AppFormSectionComponent,
  AppInputComponent,
  AppPhoneInputComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption,
  AppTextareaComponent
} from '../../../../shared/ui/app-form';
import { phoneErrorMessage } from '../../../../shared/ui/app-form/app-phone-input.component';
import { AppListResultsComponent } from '../../../../shared/ui/app-list/app-list-results.component';
import { AppListToolbarComponent } from '../../../../shared/ui/app-list/app-list-toolbar.component';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { DrawerFormComponent } from '../../../../shared/ui/drawer-form/drawer-form.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading/tc-page-skeleton.component';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { FrontDeskApiService, StaffDirectoryRow } from '../../front-desk-api.service';

type DeskFieldType = 'text' | 'datetime' | 'date' | 'number' | 'select' | 'textarea' | 'staff-search' | 'phone';

interface DeskField {
  key: string;
  label: string;
  type?: DeskFieldType;
  section: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  fullWidth?: boolean;
  options?: AppSelectOption[];
  futureOnly?: boolean;
  pastOnly?: boolean;
}

interface DeskSectionMeta {
  title: string;
  description: string;
  icon: string;
}

interface DeskPageConfig {
  path: string;
  listTitle: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyMessage: string;
  addLabel: string;
  drawerIntro: string;
  sectionOrder: string[];
  sections: Record<string, DeskSectionMeta>;
  columns: { key: string; label: string }[];
  fields: DeskField[];
  rowAction?: { label: string; path: string; tooltip: string; confirm: string };
}

function selectOpts(values: string[], labels: Record<string, string>): AppSelectOption[] {
  return values.map(value => ({ value, label: labels[value] ?? value }));
}

const PAGES: Record<string, DeskPageConfig> = {
  appointments: {
    path: 'appointments',
    listTitle: 'Appointments',
    searchPlaceholder: 'Search visitor, staff, or status',
    emptyTitle: 'No appointments',
    emptyMessage: 'Schedule walk-in or phone appointments for staff meetings.',
    addLabel: 'New appointment',
    drawerIntro: 'Book a slot and notify the staff member to confirm.',
    sectionOrder: ['party', 'schedule', 'status'],
    sections: {
      party: { title: 'Visitor & host', description: 'Who is visiting and whom they need to meet.', icon: 'pi pi-users' },
      schedule: { title: 'Schedule', description: 'Requested date, time, and brief agenda.', icon: 'pi pi-calendar' },
      status: { title: 'Status', description: 'Reception can mark pending slots until staff confirms.', icon: 'pi pi-flag' }
    },
    columns: [
      { key: 'visitorName', label: 'Visitor' },
      { key: 'staffName', label: 'Staff' },
      { key: 'requestedSlot', label: 'Slot' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'visitorName', label: 'Visitor or parent', section: 'party', placeholder: 'Full name', required: true },
      { key: 'staffId', label: 'Staff to meet', section: 'party', type: 'staff-search', required: true },
      { key: 'requestedSlot', label: 'Requested slot', section: 'schedule', type: 'datetime', required: true, futureOnly: true },
      { key: 'agenda', label: 'Agenda', section: 'schedule', type: 'textarea', fullWidth: true, placeholder: 'Reason for visit' },
      {
        key: 'status',
        label: 'Status',
        section: 'status',
        type: 'select',
        options: selectOpts(['PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED'], {
          PENDING: 'Pending',
          CONFIRMED: 'Confirmed',
          RESCHEDULED: 'Rescheduled',
          COMPLETED: 'Completed'
        })
      }
    ],
    rowAction: {
      label: 'Confirm',
      path: 'status?status=CONFIRMED',
      tooltip: 'Marks this appointment confirmed for the staff member',
      confirm: 'Confirm this appointment?'
    }
  },
  inward: {
    path: 'postal/inward',
    listTitle: 'Inward mail',
    searchPlaceholder: 'Search sender, tracking, or addressee',
    emptyTitle: 'No inward mail',
    emptyMessage: 'Log couriers and hand-delivered packets received at reception.',
    addLabel: 'Log inward mail',
    drawerIntro: 'Record what arrived and who it is addressed to.',
    sectionOrder: ['sender', 'delivery'],
    sections: {
      sender: { title: 'Sender & tracking', description: 'Courier or person who delivered the packet.', icon: 'pi pi-inbox' },
      delivery: { title: 'Delivery details', description: 'Who should receive it and when it was logged.', icon: 'pi pi-send' }
    },
    columns: [
      { key: 'senderName', label: 'Sender' },
      { key: 'trackingNumber', label: 'Tracking' },
      { key: 'addressedTo', label: 'Addressed to' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'senderName', label: 'Sender name', section: 'sender', placeholder: 'Person or organisation', required: true },
      { key: 'trackingNumber', label: 'Tracking number', section: 'sender', placeholder: 'Optional AWB / reference' },
      { key: 'courierPartner', label: 'Courier partner', section: 'sender', placeholder: 'e.g. Blue Dart, India Post' },
      { key: 'addressedTo', label: 'Addressed to', section: 'delivery', placeholder: 'Staff or department', required: true },
      { key: 'receivedAt', label: 'Received at', section: 'delivery', type: 'datetime', required: true, pastOnly: true }
    ],
    rowAction: {
      label: 'Hand over',
      path: 'hand-over',
      tooltip: 'Marks this packet as handed to the addressee',
      confirm: 'Hand this packet over?'
    }
  },
  outward: {
    path: 'postal/outward',
    listTitle: 'Outward dispatch',
    searchPlaceholder: 'Search recipient, document, or tracking',
    emptyTitle: 'No outward dispatch',
    emptyMessage: 'Track documents and parcels sent from the school.',
    addLabel: 'Log dispatch',
    drawerIntro: 'Register outgoing mail with dispatch mode and tracking.',
    sectionOrder: ['recipient', 'dispatch'],
    sections: {
      recipient: { title: 'Recipient', description: 'Who receives the document or parcel.', icon: 'pi pi-user' },
      dispatch: { title: 'Dispatch', description: 'Document type, mode, and tracking reference.', icon: 'pi pi-truck' }
    },
    columns: [
      { key: 'recipientName', label: 'Recipient' },
      { key: 'documentType', label: 'Document' },
      { key: 'dispatchDate', label: 'Date' },
      { key: 'trackingNumber', label: 'Tracking' }
    ],
    fields: [
      { key: 'recipientName', label: 'Recipient name', section: 'recipient', required: true },
      {
        key: 'destinationAddress',
        label: 'Destination address',
        section: 'recipient',
        type: 'textarea',
        fullWidth: true,
        placeholder: 'Full postal address'
      },
      { key: 'documentType', label: 'Document type', section: 'dispatch', placeholder: 'e.g. TC, marksheet copy' },
      { key: 'dispatchMode', label: 'Dispatch mode', section: 'dispatch', placeholder: 'Courier / hand delivery' },
      { key: 'dispatchDate', label: 'Dispatch date', section: 'dispatch', type: 'date', required: true },
      { key: 'trackingNumber', label: 'Tracking number', section: 'dispatch' },
      { key: 'senderReference', label: 'Internal reference', section: 'dispatch', hint: 'Your file or dispatch slip number.' }
    ]
  },
  calls: {
    path: 'calls',
    listTitle: 'Call logs',
    searchPlaceholder: 'Search caller, phone, or purpose',
    emptyTitle: 'No call logs',
    emptyMessage: 'Log incoming and outgoing calls handled at the front desk.',
    addLabel: 'Log call',
    drawerIntro: 'Capture who called, how long, and what action was taken.',
    sectionOrder: ['caller', 'call', 'followup'],
    sections: {
      caller: { title: 'Caller', description: 'Name and phone number on the line.', icon: 'pi pi-phone' },
      call: { title: 'Call details', description: 'Direction, duration, and purpose.', icon: 'pi pi-clock' },
      followup: { title: 'Follow-up', description: 'What reception did and who owns next steps.', icon: 'pi pi-arrow-right' }
    },
    columns: [
      { key: 'callerName', label: 'Caller' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'callType', label: 'Type' },
      { key: 'durationMinutes', label: 'Minutes' }
    ],
    fields: [
      { key: 'callerName', label: 'Caller name', section: 'caller', required: true },
      { key: 'phoneNumber', label: 'Phone number', section: 'caller', type: 'phone', required: true },
      {
        key: 'callType',
        label: 'Direction',
        section: 'call',
        type: 'select',
        options: selectOpts(['INCOMING', 'OUTGOING'], { INCOMING: 'Incoming', OUTGOING: 'Outgoing' })
      },
      { key: 'durationMinutes', label: 'Duration (minutes)', section: 'call', type: 'number', placeholder: '0' },
      { key: 'purpose', label: 'Purpose', section: 'call', fullWidth: true, placeholder: 'Why they called' },
      { key: 'actionTaken', label: 'Action taken', section: 'followup', type: 'textarea', fullWidth: true },
      { key: 'forwardedTo', label: 'Forwarded to', section: 'followup', placeholder: 'Staff or department', hint: 'Use Self if handled at desk.' }
    ]
  },
  grievances: {
    path: 'grievances',
    listTitle: 'Help desk',
    searchPlaceholder: 'Search complainant, category, or assignee',
    emptyTitle: 'No help desk tickets',
    emptyMessage: 'Log parent and visitor questions for follow-up by staff.',
    addLabel: 'Log ticket',
    drawerIntro: 'Capture the question and assign an owner without counseling notes.',
    sectionOrder: ['complainant', 'issue', 'assignment'],
    sections: {
      complainant: { title: 'Complainant', description: 'Who raised the query at the desk.', icon: 'pi pi-user' },
      issue: { title: 'Issue', description: 'Category and details visible to assignee.', icon: 'pi pi-comment' },
      assignment: { title: 'Assignment', description: 'Who will respond and current status.', icon: 'pi pi-check-square' }
    },
    columns: [
      { key: 'complainantName', label: 'Complainant' },
      { key: 'category', label: 'Category' },
      { key: 'assigneeName', label: 'Assignee' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      {
        key: 'complainantType',
        label: 'Complainant type',
        section: 'complainant',
        type: 'select',
        options: selectOpts(['PARENT', 'STUDENT', 'VISITOR'], {
          PARENT: 'Parent',
          STUDENT: 'Student',
          VISITOR: 'Visitor'
        })
      },
      { key: 'complainantName', label: 'Name', section: 'complainant', required: true },
      {
        key: 'category',
        label: 'Category',
        section: 'issue',
        type: 'select',
        options: selectOpts(['TRANSPORT', 'UNIFORM', 'FACILITY', 'FEE_QUERY'], {
          TRANSPORT: 'Transport',
          UNIFORM: 'Uniform',
          FACILITY: 'Facility',
          FEE_QUERY: 'Fee query'
        })
      },
      {
        key: 'details',
        label: 'Question or details',
        section: 'issue',
        type: 'textarea',
        fullWidth: true,
        required: true,
        placeholder: 'What the parent or visitor asked'
      },
      { key: 'assigneeName', label: 'Assignee', section: 'assignment', placeholder: 'Staff name or role' },
      {
        key: 'status',
        label: 'Status',
        section: 'assignment',
        type: 'select',
        options: selectOpts(['LOGGED', 'ASSIGNED', 'RESOLVED'], {
          LOGGED: 'Logged',
          ASSIGNED: 'Assigned',
          RESOLVED: 'Resolved'
        })
      }
    ]
  }
};

interface FormSectionGroup {
  id: string;
  meta: DeskSectionMeta;
  fields: DeskField[];
}

@Component({
  selector: 'app-desk-record-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent,
    AppEmptyStateComponent,
    DrawerFormComponent,
    TcPageSkeletonComponent,
    AppToastComponent,
    AppFormSectionComponent,
    AppSectionHeaderComponent,
    AppInputComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppPhoneInputComponent,
    AppDateTimeComponent,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './desk-record-page.component.html',
  styleUrls: ['../../front-desk.shared.scss', './desk-record-page.component.scss']
})
export class DeskRecordPageComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly lists = inject(ListContextService);
  private readonly messages = inject(MessageService);
  private readonly dialogs = inject(UiConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private staffSearchTimer?: ReturnType<typeof setTimeout>;

  config: DeskPageConfig = PAGES['appointments'];
  keyword = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: Record<string, unknown>[] = [];
  form: Record<string, string> = {};
  fieldErrors: Record<string, string> = {};
  drawer = false;
  editingId: number | null = null;
  firstLoad = true;
  busy = false;
  staffLookup = '';
  staff: StaffDirectoryRow[] = [];
  staffSearching = false;
  selectedStaffLabel = '';
  rescheduleOpen = false;
  rescheduleRow: Record<string, unknown> | null = null;
  rescheduleSlot = '';
  rescheduleError = '';
  rescheduling = false;
  now = new Date();

  ngOnInit(): void {
    const kind = this.route.snapshot.data['deskKind'] as string;
    this.config = PAGES[kind] ?? PAGES['appointments'];
    const saved = this.lists.peek(this.config.path);
    if (saved) {
      this.page = saved.page ?? 0;
      this.size = saved.size ?? this.size;
      this.keyword = saved.search ?? '';
    }
    this.load(this.page);
  }

  get formSectionGroups(): FormSectionGroup[] {
    return this.config.sectionOrder.map(id => ({
      id,
      meta: this.config.sections[id],
      fields: this.config.fields.filter(field => field.section === id)
    })).filter(group => group.meta && group.fields.length);
  }

  load(page: number): void {
    this.page = page;
    this.busy = true;
    this.lists.save(this.config.path, { page, size: this.size, search: this.keyword });
    this.api.list(this.config.path, page, this.size, this.keyword).subscribe({
      next: result => {
        this.rows = result.content ?? [];
        this.total = result.totalElements ?? 0;
        this.busy = false;
        this.firstLoad = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.busy = false;
        this.firstLoad = false;
        this.cdr.markForCheck();
      }
    });
  }

  reset(): void {
    this.keyword = '';
    this.load(0);
  }

  onPage(event: AppPageChangeEvent): void {
    this.size = event.rows;
    this.load(event.page);
  }

  openNew(): void {
    this.editingId = null;
    this.form = {};
    this.fieldErrors = {};
    this.staff = [];
    this.staffLookup = '';
    this.selectedStaffLabel = '';
    this.config.fields.forEach(field => {
      if (field.options?.length) {
        this.form[field.key] = String(field.options[0].value);
      }
    });
    if (this.config.path === 'calls') {
      this.form['forwardedTo'] = 'Self';
    }
    this.now = new Date();
    if (this.config.path === 'postal/inward' && !this.form['receivedAt']) {
      this.form['receivedAt'] = this.now.toISOString().slice(0, 19);
    }
    this.drawer = true;
    this.cdr.markForCheck();
  }

  searchStaff(value: string): void {
    if (this.staffSearchTimer) {
      clearTimeout(this.staffSearchTimer);
    }
    this.staffLookup = value;
    const term = (value ?? '').trim();
    if (term.length < 2) {
      this.staff = [];
      this.staffSearching = false;
      this.cdr.markForCheck();
      return;
    }
    this.staffSearching = true;
    this.staffSearchTimer = setTimeout(() => {
      this.api.staff(term).subscribe({
        next: rows => {
          this.staff = rows;
          this.staffSearching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.staff = [];
          this.staffSearching = false;
          this.cdr.markForCheck();
        }
      });
    }, 280);
  }

  pickStaff(person: StaffDirectoryRow): void {
    this.form['staffId'] = String(person.staffId);
    this.form['staffName'] = person.name;
    this.selectedStaffLabel = [person.name, person.designation, person.mobile].filter(Boolean).join(' · ');
    this.staffLookup = person.name;
    this.staff = [];
    this.fieldErrors['staffId'] = '';
    this.cdr.markForCheck();
  }

  clearStaff(): void {
    delete this.form['staffId'];
    delete this.form['staffName'];
    this.selectedStaffLabel = '';
    this.staffLookup = '';
    this.cdr.markForCheck();
  }

  clearFieldError(key: string): void {
    if (this.fieldErrors[key]) {
      this.fieldErrors = { ...this.fieldErrors, [key]: '' };
    }
  }

  save(): void {
    const errors: Record<string, string> = {};
    for (const field of this.config.fields) {
      if (!field.required) {
        continue;
      }
      const raw = (this.form[field.key] ?? '').trim();
      if (field.type === 'staff-search') {
        if (!this.form['staffId']) {
          errors[field.key] = 'Select a staff member from search results.';
        }
        continue;
      }
      if (field.type === 'phone') {
        const phoneErr = phoneErrorMessage(raw);
        if (phoneErr) {
          errors[field.key] = phoneErr;
        }
        continue;
      }
      if (!raw) {
        errors[field.key] = `${field.label} is required.`;
      }
    }
    this.fieldErrors = errors;
    if (Object.keys(errors).length) {
      this.cdr.markForCheck();
      return;
    }

    const body: Record<string, unknown> = { ...this.form };
    if (body['staffId']) {
      body['staffId'] = Number(body['staffId']);
    }
    if (body['durationMinutes']) {
      body['durationMinutes'] = Number(body['durationMinutes']);
    }
    const request = this.editingId
      ? this.api.update(this.config.path, this.editingId, body)
      : this.api.create(this.config.path, body);
    request.subscribe({
      next: () => {
        this.drawer = false;
        this.messages.add({ severity: 'success', summary: 'Saved' });
        this.load(0);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Could not save' })
    });
  }

  /** Slots are stored as UTC wall-clock values without an offset. */
  private parseUtcSlot(value: unknown): Date | null {
    if (typeof value !== 'string' || !value) {
      return null;
    }
    const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  cellValue(row: Record<string, unknown>, key: string): unknown {
    if (key === 'requestedSlot') {
      const date = this.parseUtcSlot(row[key]);
      return date
        ? date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : row[key];
    }
    return row[key];
  }

  reschedule(row: Record<string, unknown>): void {
    this.now = new Date();
    const current = this.parseUtcSlot(row['requestedSlot']);
    this.rescheduleRow = row;
    this.rescheduleSlot = current && current > this.now ? String(row['requestedSlot']) : '';
    this.rescheduleError = '';
    this.rescheduleOpen = true;
    this.cdr.markForCheck();
  }

  closeReschedule(): void {
    this.rescheduleOpen = false;
    this.rescheduleRow = null;
    this.rescheduleSlot = '';
    this.rescheduleError = '';
    this.cdr.markForCheck();
  }

  confirmReschedule(): void {
    const row = this.rescheduleRow;
    const slot = this.parseUtcSlot(this.rescheduleSlot);
    if (!row || !slot) {
      this.rescheduleError = 'Select the new date and time.';
      this.cdr.markForCheck();
      return;
    }
    if (slot.getTime() <= Date.now()) {
      this.rescheduleError = 'Choose a date and time in the future.';
      this.cdr.markForCheck();
      return;
    }
    this.rescheduling = true;
    this.api.postAction(`appointments/${row['id']}/status`, {
      status: 'RESCHEDULED',
      slot: this.rescheduleSlot
    }).subscribe({
      next: () => {
        this.rescheduling = false;
        this.closeReschedule();
        this.messages.add({ severity: 'success', summary: 'Appointment rescheduled' });
        this.load(this.page);
      },
      error: (err: HttpErrorResponse) => {
        this.rescheduling = false;
        this.rescheduleError = err.error?.message || 'Could not reschedule. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  async run(row: Record<string, unknown>): Promise<void> {
    const action = this.config.rowAction;
    if (!action) {
      return;
    }
    const ok = await this.dialogs.confirm({
      header: action.confirm,
      message: `${action.tooltip}.`,
      acceptLabel: action.label
    });
    if (!ok) {
      return;
    }
    if (this.config.path === 'appointments') {
      this.api.postAction(`appointments/${row['id']}/status`, { status: 'CONFIRMED' }).subscribe({
        next: () => this.load(this.page),
        error: () => this.messages.add({ severity: 'error', summary: 'Could not confirm' })
      });
      return;
    }
    this.api.postAction(`${this.config.path}/${row['id']}/${action.path}`).subscribe({
      next: () => this.load(this.page),
      error: () => this.messages.add({ severity: 'error', summary: 'Could not update the row' })
    });
  }
}
