import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';

import { StudentsWorkspaceService } from '../../../students/services/students-workspace.service';
import { ClassOption } from '../../../students/models/students-workspace.model';
import { AdmissionsCrmService } from '../../../admissions/services/admissions-crm.service';
import { CounselorOption, LeadCreateRequest, LeadRecord, LeadSource, LeadStatus } from '../../../admissions/models/admissions-crm.model';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { ListContextService } from '../../../../core/services/list-context.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppEmptyStateComponent } from '../../../../shared/ui/app-form/app-empty-state.component';
import { AppListResultsComponent } from '../../../../shared/ui/app-list/app-list-results.component';
import { AppListToolbarComponent } from '../../../../shared/ui/app-list/app-list-toolbar.component';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { AppValidationMessageComponent } from '../../../../shared/ui/app-form/app-validation-message.component';
import { DrawerFormComponent } from '../../../../shared/ui/drawer-form/drawer-form.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading/tc-page-skeleton.component';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';

const MOBILE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Open',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  APPLICATION_STARTED: 'Application started',
  APPLICATION_SUBMITTED: 'Converted',
  LOST: 'Dropped'
};

@Component({
  selector: 'app-front-desk-inquiries',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent, AppEmptyStateComponent, AppValidationMessageComponent, DrawerFormComponent, TcPageSkeletonComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        @if (!online) {
          <button type="button" class="tc-btn tc-btn--primary" (click)="openCreate()">Add inquiry</button>
        }
      </tc-saas-page-header>
      @if (firstLoad) {
        <tc-page-skeleton layout="directory-table" />
      } @else {
        <tc-saas-panel [title]="(online ? 'Online inquiries' : 'Admission inquiries') + ' · ' + total">
          <app-list-toolbar [search]="keyword" searchPlaceholder="Search student, parent, mobile" [searching]="busy" (searchChange)="keyword = $event" (searchDebounced)="load(0)" (submitted)="load(0)" (reset)="reset()">
            <select [(ngModel)]="status" name="status">
              <option value="">Status</option>
              @for (item of statuses; track item) { <option [value]="item">{{ label(item) }}</option> }
            </select>
          </app-list-toolbar>
          <app-list-results [busy]="busy">
            @if (!rows.length) {
              <app-empty-state title="No inquiries" message="Walk-in and website inquiries appear here from admissions." />
            } @else {
              <div class="tc-table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Parent</th><th>Mobile</th><th>Class</th><th>Counselor</th><th>Follow-up</th><th>Status</th><th>Source</th></tr></thead>
                  <tbody>
                    @for (row of rows; track row.inquiryId) {
                      <tr>
                        <td><a [routerLink]="['/app/front-desk/inquiries', row.inquiryId]">{{ row.studentName || row.name }}</a></td>
                        <td>{{ row.parentContactName }}</td>
                        <td>{{ row.mobileNumber }}</td>
                        <td>{{ row.classInterestedIn }}</td>
                        <td>{{ row.assignedCounselorName }}</td>
                        <td>{{ row.nextFollowUpDate | date:'mediumDate' }}</td>
                        <td><span class="adm-badge">{{ label(row.status) }}</span></td>
                        <td>{{ sourceLabel(row.inquirySource) }}</td>
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
      <tc-drawer-form [open]="drawer" title="Add inquiry" (closed)="drawer = false">
        <form class="desk-form">
          <label>Student name <input [(ngModel)]="draft.studentName" name="studentName" /></label>
          <label>Parent name <input [(ngModel)]="draft.parent" name="parent" /></label>
          <label>Mobile <input [(ngModel)]="draft.mobile" name="mobile" /></label>
          <app-validation-message *ngIf="mobileError" message="Enter a valid Indian mobile number" />
          <label>Academic year
            <select [(ngModel)]="draft.academicYearId" name="academicYearId" (ngModelChange)="loadClasses($event)">
              <option [ngValue]="null">Select year</option>
              @for (year of years; track year.id) { <option [ngValue]="year.id">{{ year.label }}</option> }
            </select>
          </label>
          <label>Class
            <select [(ngModel)]="draft.classId" name="classId">
              <option [ngValue]="null">Select class</option>
              @for (cls of classes; track cls.id) { <option [ngValue]="cls.id">{{ cls.label }}</option> }
            </select>
          </label>
          <label>Address <input [(ngModel)]="draft.address" name="address" /></label>
          <label>Comments <textarea [(ngModel)]="draft.comments" name="comments"></textarea></label>
          <label>Counselor
            <select [(ngModel)]="draft.counselorId" name="counselorId">
              <option [ngValue]="null">Unassigned</option>
              @for (c of counselors; track c.staffId) { <option [ngValue]="c.staffId">{{ c.fullName }}</option> }
            </select>
          </label>
          <label>Next follow-up <input type="date" [(ngModel)]="draft.followUp" name="followUp" /></label>
        </form>
        <div drawer-actions>
          <button type="button" class="tc-btn tc-btn--primary" (click)="create()">Save</button>
        </div>
      </tc-drawer-form>
      <app-toast />
    </section>
  `,
})
export class FrontDeskInquiriesComponent implements OnInit {
  private readonly crm = inject(AdmissionsCrmService);
  private readonly students = inject(StudentsWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly lists = inject(ListContextService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  online = false;
  keyword = '';
  status = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: LeadRecord[] = [];
  counselors: CounselorOption[] = [];
  firstLoad = true;
  busy = false;
  drawer = false;
  mobileError = false;
  statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'LOST'];
  years: ClassOption[] = [];
  classes: ClassOption[] = [];
  draft = { studentName: '', parent: '', mobile: '', academicYearId: null as number | null, classId: null as number | null, address: '', comments: '', counselorId: null as number | null, followUp: '' };

  ngOnInit(): void {
    this.online = this.route.snapshot.data['online'] === true;
    const saved = this.lists.peek(this.key);
    if (saved) {
      this.page = saved.page ?? 0;
      this.size = saved.size ?? this.size;
      this.keyword = saved.search ?? '';
    }
    this.crm.searchCounselors('', 0, 50).subscribe({ next: page => { this.counselors = page.content ?? []; this.cdr.markForCheck(); } });
    this.students.listAcademicYears().subscribe({ next: years => { this.years = years; this.cdr.markForCheck(); } });
    this.load(this.page);
  }

  get key(): string {
    return this.online ? 'front-desk-online-inquiries' : 'front-desk-inquiries';
  }

  label(status: string | null | undefined): string {
    return STATUS_LABEL[status || ''] || status || '';
  }

  sourceLabel(source: LeadSource | null | undefined): string {
    if (source === 'WEBSITE') return 'Website';
    if (source === 'CAMPAIGN') return 'Ad';
    return source || '';
  }

  load(page: number): void {
    this.page = page;
    this.busy = true;
    this.lists.save(this.key, { page, size: this.size, search: this.keyword, filters: { status: this.status } });
    this.crm.searchLeads({
      keyword: this.keyword,
      status: (this.status || null) as LeadStatus | null,
      sources: this.online ? ['WEBSITE', 'CAMPAIGN'] : null,
      scope: 'ALL'
    }, page, this.size).subscribe({
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
        this.messages.add({ severity: 'error', summary: 'Inquiries could not be loaded' });
        this.cdr.markForCheck();
      }
    });
  }

  reset(): void {
    this.keyword = '';
    this.status = '';
    this.load(0);
  }

  onPage(event: AppPageChangeEvent): void {
    this.size = event.rows;
    this.load(event.page);
  }

  loadClasses(yearId: number | null): void {
    if (!yearId) {
      this.classes = [];
      return;
    }
    this.students.listClasses(yearId).subscribe({ next: rows => { this.classes = rows; this.cdr.markForCheck(); } });
  }

  openCreate(): void {
    this.drawer = true;
  }

  create(): void {
    const selectedClass = this.classes.find(item => item.id === this.draft.classId);
    this.mobileError = !MOBILE.test(this.draft.mobile.trim());
    if (this.mobileError || !this.draft.studentName.trim() || !this.draft.parent.trim() || !this.draft.classId || !this.draft.academicYearId) {
      this.cdr.markForCheck();
      return;
    }
    const payload: LeadCreateRequest = {
      name: this.draft.studentName.trim(),
      parentContactName: this.draft.parent.trim(),
      mobileNumber: this.draft.mobile.trim(),
      classInterestedIn: selectedClass?.label || '',
      academicYearId: this.draft.academicYearId,
      classId: this.draft.classId,
      address: this.draft.address.trim() || null,
      comments: this.draft.comments.trim() || null,
      inquirySource: 'WALK_IN',
      assignedCounselorId: this.draft.counselorId,
      nextFollowUpDate: this.draft.followUp || null
    } as LeadCreateRequest;
    this.crm.createLead(payload).subscribe({
      next: () => {
        this.drawer = false;
        this.messages.add({ severity: 'success', summary: 'Inquiry saved' });
        this.load(0);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Inquiry could not be saved' })
    });
  }
}
