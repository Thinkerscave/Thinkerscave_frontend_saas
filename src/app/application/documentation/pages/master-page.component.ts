import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../core/feedback/app-toast.component';
import { UI_PAGINATION } from '../../../shared/config/ui-standards';
import { AppListToolbarComponent } from '../../../shared/ui/app-list/app-list-toolbar.component';
import { AppPaginatorComponent } from '../../../shared/ui/app-list/app-paginator.component';
import { DrawerFormComponent } from '../../../shared/ui/drawer-form/drawer-form.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../shared/ui/saas/saas-primitives';
import { AppPageChangeEvent } from '../../../shared/utils/paged-result.util';
import { StudentsWorkspaceService } from '../../students/services/students-workspace.service';
import { ClassOption } from '../../students/models/students-workspace.model';
import { DocMaster, DocumentationApiService } from '../documentation-api.service';

@Component({
  selector: 'app-documentation-master-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, AppListToolbarComponent, AppPaginatorComponent, DrawerFormComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        <button type="button" class="tc-btn tc-btn--primary" (click)="openNew()">Add</button>
      </tc-saas-page-header>
      <tc-saas-panel [title]="total + ''">
        <app-list-toolbar [search]="keyword" searchPlaceholder="Search master" [searching]="busy" (searchChange)="keyword = $event" (searchDebounced)="load(0)" (submitted)="load(0)" (reset)="keyword = ''; status = ''; load(0)">
          <select [(ngModel)]="status" name="status">
            <option value="">Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </app-list-toolbar>
        <div class="tc-table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Classes</th><th>Status</th><th></th></tr></thead>
            <tbody>
              @for (row of rows; track row.id) {
                <tr>
                  <td>{{ row.masterName }}</td>
                  <td>{{ row.collectionType || row.materialType }}</td>
                  <td>{{ row.classIds }}</td>
                  <td>{{ row.status }} @if (row.rejectionReason) { · {{ row.rejectionReason }} }</td>
                  <td>
                    <button type="button" class="tc-btn" title="Sends this master to the principal. It can be used for a class only after approval." [disabled]="row.status === 'APPROVED'" (click)="submit(row)">Submit</button>
                    <button type="button" class="tc-btn" (click)="approve(row)">Approve</button>
                    <button type="button" class="tc-btn" (click)="reject(row)">Reject</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-paginator [page]="page" [rows]="size" [totalRecords]="total" (pageChange)="onPage($event)" />
      </tc-saas-panel>
      <tc-drawer-form [open]="drawer" [title]="form.id ? 'Edit' : 'Add'" (closed)="drawer = false">
        <form class="desk-form">
          <label>Name <input [(ngModel)]="form.masterName" name="masterName" /></label>
          <label>Type <input [(ngModel)]="typeValue" name="typeValue" /></label>
          <label>Description <textarea [(ngModel)]="form.description" name="description"></textarea></label>
          <label>Classes
            @for (cls of classes; track cls.id) {
              <span><input type="checkbox" [checked]="selectedClasses.has(cls.id)" (change)="toggleClass(cls.id)" /> {{ cls.label }}</span>
            }
          </label>
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
export class DocumentationMasterPageComponent implements OnInit {
  private readonly api = inject(DocumentationApiService);
  private readonly students = inject(StudentsWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  kind: 'collection-masters' | 'material-masters' = 'collection-masters';
  keyword = '';
  status = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: DocMaster[] = [];
  busy = false;
  drawer = false;
  form: DocMaster = {};
  typeValue = '';
  classes: ClassOption[] = [];
  selectedClasses = new Set<number>();

  ngOnInit(): void {
    this.kind = this.route.snapshot.data['masterKind'] === 'material' ? 'material-masters' : 'collection-masters';
    this.students.listAcademicYears().subscribe(years => {
      const yearId = years[0]?.id;
      if (yearId) this.students.listClasses(yearId).subscribe(rows => { this.classes = rows; this.cdr.markForCheck(); });
    });
    this.load(0);
  }

  load(page: number): void {
    this.page = page;
    this.busy = true;
    this.api.masters(this.kind, page, this.size, this.keyword, this.status).subscribe({
      next: result => { this.rows = result.content ?? []; this.total = result.totalElements ?? 0; this.busy = false; this.cdr.markForCheck(); },
      error: () => { this.busy = false; this.cdr.markForCheck(); }
    });
  }

  onPage(event: AppPageChangeEvent): void {
    this.size = event.rows;
    this.load(event.page);
  }

  openNew(): void {
    this.form = {};
    this.typeValue = '';
    this.selectedClasses = new Set();
    this.drawer = true;
  }

  toggleClass(id: number): void {
    if (this.selectedClasses.has(id)) this.selectedClasses.delete(id);
    else this.selectedClasses.add(id);
  }

  save(): void {
    const body: DocMaster = {
      ...this.form,
      classIds: [...this.selectedClasses].join(','),
      collectionType: this.kind === 'collection-masters' ? this.typeValue : undefined,
      materialType: this.kind === 'material-masters' ? this.typeValue : undefined
    };
    this.api.saveMaster(this.kind, body).subscribe({
      next: () => { this.drawer = false; this.messages.add({ severity: 'success', summary: 'Master saved' }); this.load(0); },
      error: () => this.messages.add({ severity: 'error', summary: 'Master could not be saved' })
    });
  }

  submit(row: DocMaster): void {
    if (!row.id || !confirm('Send this master to the principal?')) return;
    this.api.masterAction(this.kind, row.id, 'submit').subscribe({ next: () => this.load(this.page) });
  }

  approve(row: DocMaster): void {
    if (!row.id) return;
    this.api.masterAction(this.kind, row.id, 'approve').subscribe({
      next: () => this.load(this.page),
      error: () => this.messages.add({ severity: 'error', summary: 'Approval needs the principal permission' })
    });
  }

  reject(row: DocMaster): void {
    if (!row.id) return;
    const reason = prompt('Rejection reason');
    if (!reason?.trim()) return;
    this.api.masterAction(this.kind, row.id, 'reject', reason.trim()).subscribe({ next: () => this.load(this.page) });
  }
}
