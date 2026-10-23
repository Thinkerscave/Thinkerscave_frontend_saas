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
import {
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
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    RouterLink,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent,
    AppEmptyStateComponent,
    DrawerFormComponent,
    TcPageSkeletonComponent,
    AppFormSectionComponent,
    AppSectionHeaderComponent,
    AppInputComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppPhoneInputComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './front-desk-inquiries.component.html',
  styleUrls: ['../../front-desk.shared.scss', '../records/desk-record-page.component.scss']
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
  fieldErrors: Record<string, string> = {};
  statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'LOST'];
  years: ClassOption[] = [];
  classes: ClassOption[] = [];
  draft = {
    studentName: '',
    parent: '',
    mobile: '',
    academicYearId: null as string | null,
    classId: null as string | null,
    address: '',
    comments: '',
    counselorId: null as string | null,
    followUp: ''
  };

  ngOnInit(): void {
    this.online = this.route.snapshot.data['online'] === true;
    const saved = this.lists.peek(this.key);
    if (saved) {
      this.page = saved.page ?? 0;
      this.size = saved.size ?? this.size;
      this.keyword = saved.search ?? '';
    }
    this.crm.searchCounselors('', 0, 50).subscribe({
      next: page => {
        this.counselors = page.content ?? [];
        this.cdr.markForCheck();
      }
    });
    this.students.listAcademicYears().subscribe({
      next: years => {
        this.years = years;
        this.cdr.markForCheck();
      }
    });
    this.load(this.page);
  }

  get key(): string {
    return this.online ? 'front-desk-online-inquiries' : 'front-desk-inquiries';
  }

  get yearOptions(): AppSelectOption[] {
    return this.years.map(y => ({ value: String(y.id), label: y.label }));
  }

  get classOptions(): AppSelectOption[] {
    return this.classes.map(c => ({ value: String(c.id), label: c.label }));
  }

  get counselorOptions(): AppSelectOption[] {
    return [
      { value: '', label: 'Unassigned' },
      ...this.counselors.map(c => ({ value: String(c.staffId), label: c.fullName }))
    ];
  }

  label(status: string | null | undefined): string {
    return STATUS_LABEL[status || ''] || status || '';
  }

  sourceLabel(source: LeadSource | null | undefined): string {
    if (source === 'WEBSITE') return 'Website';
    if (source === 'CAMPAIGN') return 'Ad';
    if (source === 'WALK_IN') return 'Walk-in';
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

  onYearChange(yearKey: string | null): void {
    this.clearError('academicYearId');
    this.loadClasses(yearKey ? Number(yearKey) : null);
  }

  loadClasses(yearId: number | null): void {
    if (!yearId) {
      this.classes = [];
      this.draft.classId = null;
      this.cdr.markForCheck();
      return;
    }
    this.students.listClasses(yearId).subscribe({
      next: rows => {
        this.classes = rows;
        this.cdr.markForCheck();
      }
    });
  }

  openCreate(): void {
    this.fieldErrors = {};
    this.drawer = true;
  }

  clearError(key: string): void {
    if (this.fieldErrors[key]) {
      this.fieldErrors = { ...this.fieldErrors, [key]: '' };
    }
  }

  create(): void {
    const errors: Record<string, string> = {};
    if (!this.draft.studentName.trim()) {
      errors['studentName'] = 'Student name is required.';
    }
    if (!this.draft.parent.trim()) {
      errors['parent'] = 'Parent name is required.';
    }
    const phoneErr = phoneErrorMessage(this.draft.mobile);
    if (phoneErr) {
      errors['mobile'] = phoneErr;
    }
    if (!this.draft.academicYearId?.trim()) {
      errors['academicYearId'] = 'Select an academic year.';
    }
    if (!this.draft.classId?.trim()) {
      errors['classId'] = 'Select a class.';
    }
    this.fieldErrors = errors;
    if (Object.keys(errors).length) {
      this.cdr.markForCheck();
      return;
    }

    const classId = Number(this.draft.classId);
    const selectedClass = this.classes.find(item => item.id === classId);
    const counselorKey = this.draft.counselorId?.trim();
    const payload: LeadCreateRequest = {
      name: this.draft.studentName.trim(),
      parentContactName: this.draft.parent.trim(),
      mobileNumber: this.draft.mobile.trim(),
      classInterestedIn: selectedClass?.label || '',
      academicYearId: Number(this.draft.academicYearId),
      classId,
      address: this.draft.address.trim() || null,
      comments: this.draft.comments.trim() || null,
      inquirySource: 'WALK_IN',
      assignedCounselorId: counselorKey ? Number(counselorKey) : null,
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
