import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../core/feedback/app-toast.component';
import { UiConfirmService } from '../../../core/feedback/ui-confirm.service';
import { UI_PAGINATION } from '../../../shared/config/ui-standards';
import {
  AppEmptyStateComponent,
  AppFormSectionComponent,
  AppInputComponent,
  AppTextareaComponent
} from '../../../shared/ui/app-form';
import { AppListResultsComponent } from '../../../shared/ui/app-list/app-list-results.component';
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
    AppFormSectionComponent,
    AppInputComponent,
    AppTextareaComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './master-page.component.html',
  styleUrls: ['../../front-desk/front-desk.shared.scss', '../documentation.shared.scss']
})
export class DocumentationMasterPageComponent implements OnInit {
  private readonly api = inject(DocumentationApiService);
  private readonly students = inject(StudentsWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly dialogs = inject(UiConfirmService);
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
      if (yearId) {
        this.students.listClasses(yearId).subscribe(rows => {
          this.classes = rows;
          this.cdr.markForCheck();
        });
      }
    });
    this.load(0);
  }

  get listTitle(): string {
    return this.kind === 'material-masters' ? 'Material masters' : 'Collection masters';
  }

  get listIntro(): string {
    return this.kind === 'material-masters'
      ? 'Define study material types per class. Principal must approve before handover runs.'
      : 'Define document collection types per class. Principal must approve before collection runs.';
  }

  get emptyMessage(): string {
    return 'Create a master, submit for approval, then use it in class collection or handover.';
  }

  get drawerIntro(): string {
    return 'Draft masters can be edited until submitted to the principal.';
  }

  get typeLabel(): string {
    return this.kind === 'material-masters' ? 'Material type' : 'Collection type';
  }

  load(page: number): void {
    this.page = page;
    this.busy = true;
    this.api.masters(this.kind, page, this.size, this.keyword, this.status).subscribe({
      next: result => {
        this.rows = result.content ?? [];
        this.total = result.totalElements ?? 0;
        this.busy = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.busy = false;
        this.cdr.markForCheck();
      }
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
    if (this.selectedClasses.has(id)) {
      this.selectedClasses.delete(id);
    } else {
      this.selectedClasses.add(id);
    }
  }

  save(): void {
    const body: DocMaster = {
      ...this.form,
      classIds: [...this.selectedClasses].join(','),
      collectionType: this.kind === 'collection-masters' ? this.typeValue : undefined,
      materialType: this.kind === 'material-masters' ? this.typeValue : undefined
    };
    this.api.saveMaster(this.kind, body).subscribe({
      next: () => {
        this.drawer = false;
        this.messages.add({ severity: 'success', summary: 'Master saved' });
        this.load(0);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Master could not be saved' })
    });
  }

  async submit(row: DocMaster): Promise<void> {
    if (!row.id) {
      return;
    }
    const ok = await this.dialogs.confirm({
      header: 'Submit for approval?',
      message: 'Send this master to the principal for approval.',
      acceptLabel: 'Submit'
    });
    if (!ok) {
      return;
    }
    this.api.masterAction(this.kind, row.id, 'submit').subscribe({ next: () => this.load(this.page) });
  }

  approve(row: DocMaster): void {
    if (!row.id) {
      return;
    }
    this.api.masterAction(this.kind, row.id, 'approve').subscribe({
      next: () => this.load(this.page),
      error: () => this.messages.add({ severity: 'error', summary: 'Approval needs principal permission' })
    });
  }

  reject(row: DocMaster): void {
    if (!row.id) {
      return;
    }
    const reason = prompt('Rejection reason');
    if (!reason?.trim()) {
      return;
    }
    this.api.masterAction(this.kind, row.id, 'reject', reason.trim()).subscribe({ next: () => this.load(this.page) });
  }
}
