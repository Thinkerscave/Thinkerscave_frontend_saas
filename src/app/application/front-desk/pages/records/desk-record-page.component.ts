import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { ListContextService } from '../../../../core/services/list-context.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppEmptyStateComponent } from '../../../../shared/ui/app-form/app-empty-state.component';
import { AppListResultsComponent } from '../../../../shared/ui/app-list/app-list-results.component';
import { AppListToolbarComponent } from '../../../../shared/ui/app-list/app-list-toolbar.component';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { DrawerFormComponent } from '../../../../shared/ui/drawer-form/drawer-form.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading/tc-page-skeleton.component';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { FrontDeskApiService, StaffDirectoryRow } from '../../front-desk-api.service';

interface DeskField {
  key: string;
  label: string;
  type?: 'text' | 'datetime-local' | 'date' | 'number' | 'select';
  options?: string[];
}

interface DeskPageConfig {
  path: string;
  addLabel: string;
  columns: { key: string; label: string }[];
  fields: DeskField[];
  rowAction?: { label: string; path: string; tooltip: string; confirm: string };
}

const PAGES: Record<string, DeskPageConfig> = {
  appointments: {
    path: 'appointments',
    addLabel: 'New appointment',
    columns: [
      { key: 'visitorName', label: 'Visitor' },
      { key: 'staffName', label: 'Staff' },
      { key: 'requestedSlot', label: 'Slot' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'visitorName', label: 'Visitor or parent' },
      { key: 'staffId', label: 'Staff to meet' },
      { key: 'requestedSlot', label: 'Slot', type: 'datetime-local' },
      { key: 'agenda', label: 'Agenda' },
      { key: 'status', label: 'Status', type: 'select', options: ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED'] }
    ],
    rowAction: { label: 'Confirm', path: 'status?status=CONFIRMED', tooltip: 'Marks this appointment confirmed for the staff member', confirm: 'Confirm this appointment?' }
  },
  inward: {
    path: 'postal/inward',
    addLabel: 'Log inward mail',
    columns: [
      { key: 'senderName', label: 'Sender' },
      { key: 'trackingNumber', label: 'Tracking' },
      { key: 'addressedTo', label: 'Addressed to' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'senderName', label: 'Sender' },
      { key: 'trackingNumber', label: 'Tracking number' },
      { key: 'courierPartner', label: 'Courier partner' },
      { key: 'addressedTo', label: 'Addressed to' },
      { key: 'receivedAt', label: 'Received at', type: 'datetime-local' }
    ],
    rowAction: { label: 'Hand over', path: 'hand-over', tooltip: 'Marks this packet as handed to the addressee', confirm: 'Hand this packet over?' }
  },
  outward: {
    path: 'postal/outward',
    addLabel: 'Log dispatch',
    columns: [
      { key: 'recipientName', label: 'Recipient' },
      { key: 'documentType', label: 'Document' },
      { key: 'dispatchDate', label: 'Date' },
      { key: 'trackingNumber', label: 'Tracking' }
    ],
    fields: [
      { key: 'recipientName', label: 'Recipient' },
      { key: 'destinationAddress', label: 'Address' },
      { key: 'documentType', label: 'Document type' },
      { key: 'dispatchMode', label: 'Mode' },
      { key: 'dispatchDate', label: 'Dispatch date', type: 'date' },
      { key: 'trackingNumber', label: 'Tracking number' },
      { key: 'senderReference', label: 'Sender reference' }
    ]
  },
  calls: {
    path: 'calls',
    addLabel: 'Log call',
    columns: [
      { key: 'callerName', label: 'Caller' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'callType', label: 'Type' },
      { key: 'durationMinutes', label: 'Minutes' }
    ],
    fields: [
      { key: 'callerName', label: 'Caller' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'callType', label: 'Direction', type: 'select', options: ['INCOMING', 'OUTGOING'] },
      { key: 'durationMinutes', label: 'Duration minutes', type: 'number' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'actionTaken', label: 'Action taken' },
      { key: 'forwardedTo', label: 'Forwarded to' }
    ]
  },
  grievances: {
    path: 'grievances',
    addLabel: 'Log grievance',
    columns: [
      { key: 'complainantName', label: 'Complainant' },
      { key: 'category', label: 'Category' },
      { key: 'assigneeName', label: 'Assignee' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'complainantType', label: 'Complainant type', type: 'select', options: ['PARENT', 'STUDENT', 'VISITOR'] },
      { key: 'complainantName', label: 'Name' },
      { key: 'category', label: 'Category', type: 'select', options: ['TRANSPORT', 'UNIFORM', 'FACILITY', 'FEE_QUERY'] },
      { key: 'details', label: 'Question or details' },
      { key: 'assigneeName', label: 'Assignee' },
      { key: 'status', label: 'Status', type: 'select', options: ['LOGGED', 'ASSIGNED', 'RESOLVED'] }
    ]
  }
};

@Component({
  selector: 'app-desk-record-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent, AppEmptyStateComponent, DrawerFormComponent, TcPageSkeletonComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        <button type="button" class="tc-btn tc-btn--primary" (click)="openNew()">{{ config.addLabel }}</button>
      </tc-saas-page-header>
      @if (firstLoad) {
        <tc-page-skeleton layout="directory-table" />
      } @else {
        <tc-saas-panel [title]="total + ''">
          <app-list-toolbar [search]="keyword" searchPlaceholder="Search" [searching]="busy" (searchChange)="keyword = $event" (searchDebounced)="load(0)" (submitted)="load(0)" (reset)="reset()" />
          <app-list-results [busy]="busy">
            @if (!rows.length) {
              <app-empty-state title="Nothing logged yet" />
            } @else {
              <div class="tc-table-wrap">
                <table>
                  <thead>
                    <tr>
                      @for (col of config.columns; track col.key) { <th>{{ col.label }}</th> }
                      @if (config.rowAction) { <th></th> }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of rows; track row['id']) {
                      <tr>
                        @for (col of config.columns; track col.key) { <td>{{ row[col.key] }}</td> }
                        @if (config.rowAction) {
                          <td>
                            <button type="button" class="tc-btn" [title]="config.rowAction.tooltip" (click)="run(row)">{{ config.rowAction.label }}</button>
                            @if (config.path === 'appointments') {
                              <button type="button" class="tc-btn" title="Moves this appointment to a new slot" (click)="reschedule(row)">Reschedule</button>
                            }
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </app-list-results>
          <app-paginator [page]="page" [rows]="size" [totalRecords]="total" (pageChange)="onPage($event)" />
        </tc-saas-panel>
      }
      <tc-drawer-form [open]="drawer" [title]="editingId ? 'Edit' : 'Add'" (closed)="drawer = false">
        <form class="desk-form">
          @for (field of config.fields; track field.key) {
            <label>{{ field.label }}
              @if (field.key === 'staffId') {
                <input [ngModel]="staffLookup" (ngModelChange)="searchStaff($event)" name="staffLookup" />
                @for (person of staff; track person.staffId) {
                  <button type="button" class="tc-btn" (click)="pickStaff(person)">{{ person.name }} · {{ person.designation }} · {{ person.mobile }}</button>
                }
              } @else if (field.type === 'select') {
                <select [(ngModel)]="form[field.key]" [name]="field.key">
                  @for (option of field.options; track option) { <option [value]="option">{{ option }}</option> }
                </select>
              } @else {
                <input [type]="field.type || 'text'" [(ngModel)]="form[field.key]" [name]="field.key" />
              }
            </label>
          }
        </form>
        <div drawer-actions>
          <button type="button" class="tc-btn tc-btn--primary" (click)="save()">Save</button>
        </div>
      </tc-drawer-form>
      <app-toast />
    </section>
  `,
  styles: [`.desk-form { display: grid; gap: 0.7rem; } label { display: grid; gap: 0.25rem; }`]
})
export class DeskRecordPageComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly lists = inject(ListContextService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  config: DeskPageConfig = PAGES['appointments'];
  keyword = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: Record<string, unknown>[] = [];
  form: Record<string, string> = {};
  drawer = false;
  editingId: number | null = null;
  firstLoad = true;
  busy = false;
  staffLookup = '';
  staff: StaffDirectoryRow[] = [];

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
    this.config.fields.forEach(field => {
      if (field.options?.length) this.form[field.key] = field.options[0];
    });
    if (this.config.path === 'calls') this.form['forwardedTo'] = 'Self';
    this.drawer = true;
  }

  searchStaff(value: string): void {
    this.staffLookup = value;
    this.api.staff(value).subscribe(rows => {
      this.staff = rows;
      this.cdr.markForCheck();
    });
  }

  pickStaff(person: StaffDirectoryRow): void {
    this.form['staffId'] = String(person.staffId);
    this.form['staffName'] = person.name;
    this.staffLookup = person.name;
  }

  save(): void {
    const body: Record<string, unknown> = { ...this.form };
    if (body['staffId']) body['staffId'] = Number(body['staffId']);
    if (body['durationMinutes']) body['durationMinutes'] = Number(body['durationMinutes']);
    if (typeof body['requestedSlot'] === 'string' && body['requestedSlot']) body['requestedSlot'] = new Date(String(body['requestedSlot'])).toISOString().slice(0, 19);
    if (typeof body['receivedAt'] === 'string' && body['receivedAt']) body['receivedAt'] = new Date(String(body['receivedAt'])).toISOString().slice(0, 19);
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

  reschedule(row: Record<string, unknown>): void {
    const slot = prompt('New slot (YYYY-MM-DDTHH:mm)');
    if (!slot) return;
    this.api.postAction(`appointments/${row['id']}/status`, { status: 'RESCHEDULED', slot: slot.length === 16 ? `${slot}:00` : slot }).subscribe({
      next: () => this.load(this.page),
      error: () => this.messages.add({ severity: 'error', summary: 'Could not reschedule' })
    });
  }

  run(row: Record<string, unknown>): void {
    const action = this.config.rowAction;
    if (!action || !confirm(action.confirm)) return;
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
