import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { WorkspaceSwitcherService } from '../../../../core/services/workspace-switcher.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppListToolbarComponent } from '../../../../shared/ui/app-list/app-list-toolbar.component';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { FrontDeskApiService, StudentDirectoryRow } from '../../front-desk-api.service';

@Component({
  selector: 'app-certificate-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, AppListToolbarComponent, AppPaginatorComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header></tc-saas-page-header>
      <tc-saas-panel title="New request">
        <div class="desk-form">
        <label>Student <input [(ngModel)]="lookup" name="lookup" (ngModelChange)="search($event)" /></label>
        <ul>
          @for (student of students; track student.studentId) {
            <li><button type="button" class="tc-btn" (click)="pick(student)">{{ student.studentName }} · {{ student.className }} · {{ student.rollNumber }} · {{ student.parentName }} · {{ student.parentMobile }}</button></li>
          }
        </ul>
        <label>Type
          <select [(ngModel)]="certificateType" name="certificateType">
            <option value="BONAFIDE">Bonafide</option>
            <option value="FEE_ESTIMATE">Fee estimate</option>
            <option value="CHARACTER">Character</option>
            <option value="TRANSFER_STATUS">Transfer status</option>
          </select>
        </label>
        <button type="button" class="tc-btn tc-btn--primary" [disabled]="!selected" (click)="create()">Request</button>
        </div>
      </tc-saas-panel>
      <tc-saas-panel [title]="'Requests · ' + total">
        <app-list-toolbar [search]="keyword" searchPlaceholder="Search student" [searching]="busy" (searchChange)="keyword = $event" (searchDebounced)="load(0)" (submitted)="load(0)" (reset)="keyword = ''; load(0)" />
        <div class="tc-table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Type</th><th>Status</th><th></th></tr></thead>
            <tbody>
              @for (row of rows; track row['id']) {
                <tr>
                  <td>{{ row['studentName'] }} · {{ row['className'] }} · {{ row['rollNumber'] }}</td>
                  <td>{{ row['certificateType'] }}</td>
                  <td>{{ row['issuanceStatus'] }} @if (row['tcNumber']) { · {{ row['tcNumber'] }} · {{ row['tcIssuedOn'] }} }</td>
                  <td>
                    <button type="button" class="tc-btn" title="Prints the saved certificate. It stays disabled until the request is approved." [disabled]="row['issuanceStatus'] !== 'APPROVED'" (click)="print(row)">Print</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-paginator [page]="page" [rows]="size" [totalRecords]="total" (pageChange)="onPage($event)" />
      </tc-saas-panel>
      @if (printable) {
        <article class="desk-print" id="certificate-print">
          <h1>{{ orgName }}</h1>
          <p>{{ printable['studentName'] }} · {{ printable['className'] }} · {{ printable['rollNumber'] }}</p>
          <p>{{ printable['certificateType'] }}</p>
          @if (printable['tcNumber']) { <p>Transfer certificate {{ printable['tcNumber'] }} issued {{ printable['tcIssuedOn'] }}</p> }
        </article>
      }
      <app-toast />
    </section>
  `,
  styles: [`@media print { .tc-page-shell > :not(.desk-print) { display: none; } }`]
})
export class CertificateRequestsComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly workspaces = inject(WorkspaceSwitcherService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  lookup = '';
  students: StudentDirectoryRow[] = [];
  selected: StudentDirectoryRow | null = null;
  certificateType = 'BONAFIDE';
  keyword = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: Record<string, unknown>[] = [];
  busy = false;
  printable: Record<string, unknown> | null = null;
  orgName = '';

  ngOnInit(): void {
    this.workspaces.listOrganizations().subscribe({ next: rows => { this.orgName = rows.find(row => row.current)?.organizationName || ''; this.cdr.markForCheck(); } });
    this.load(0);
  }

  search(value: string): void {
    this.api.students(value).subscribe(rows => { this.students = rows; this.cdr.markForCheck(); });
  }

  pick(student: StudentDirectoryRow): void {
    this.selected = student;
    this.lookup = student.studentName;
  }

  create(): void {
    if (!this.selected) return;
    this.api.create('certificate-requests', {
      studentId: this.selected.studentId,
      studentName: this.selected.studentName,
      className: this.selected.className,
      rollNumber: this.selected.rollNumber,
      certificateType: this.certificateType
    }).subscribe({
      next: () => { this.messages.add({ severity: 'success', summary: 'Request saved' }); this.load(0); },
      error: () => this.messages.add({ severity: 'error', summary: 'Request could not be saved' })
    });
  }

  load(page: number): void {
    this.page = page;
    this.busy = true;
    this.api.list('certificate-requests', page, this.size, this.keyword).subscribe({
      next: result => { this.rows = result.content ?? []; this.total = result.totalElements ?? 0; this.busy = false; this.cdr.markForCheck(); },
      error: () => { this.busy = false; this.cdr.markForCheck(); }
    });
  }

  onPage(event: AppPageChangeEvent): void {
    this.size = event.rows;
    this.load(event.page);
  }

  print(row: Record<string, unknown>): void {
    this.api.postAction(`certificate-requests/${row['id']}/print`).subscribe({
      next: saved => {
        this.printable = saved;
        this.cdr.markForCheck();
        setTimeout(() => window.print(), 50);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Print is available only after approval' })
    });
  }
}
