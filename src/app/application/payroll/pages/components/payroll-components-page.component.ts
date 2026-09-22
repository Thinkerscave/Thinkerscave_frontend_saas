import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { SalaryComponentDialogComponent } from '../../components/salary-component-dialog/salary-component-dialog.component';
import {
  CALC_METHOD_LABELS,
  COMPONENT_TYPE_LABELS,
  PAYROLL_RESOURCES,
  SalaryComponent,
  SalaryComponentType
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-payroll-components-page',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ConfirmDialogModule,
    HasPermissionDirective,
    AppToastComponent,
    SaasPageHeaderComponent,
    TcPageSkeletonComponent,
    SalaryComponentDialogComponent
  ],
  templateUrl: './payroll-components-page.component.html',
  styleUrls: ['../../payroll.shared.scss', './payroll-components-page.component.scss']
})
export class PayrollComponentsPageComponent implements OnInit {
  private readonly api = inject(PayrollApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly confirm = inject(ConfirmationService);

  readonly resources = PAYROLL_RESOURCES;
  readonly typeLabels = COMPONENT_TYPE_LABELS;
  readonly methodLabels = CALC_METHOD_LABELS;
  readonly types = Object.keys(COMPONENT_TYPE_LABELS) as SalaryComponentType[];

  rows: SalaryComponent[] = [];
  loading = true;
  error: string | null = null;
  q = '';
  componentType = '';
  status = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  dialogVisible = false;
  editing: SalaryComponent | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api
      .listComponents(
        { q: this.q || undefined, componentType: this.componentType || undefined, status: this.status || undefined },
        this.page,
        this.size
      )
      .pipe(finalizeBusy(v => (this.loading = v)))
      .subscribe({
        next: page => {
          this.rows = page.content;
          this.total = page.totalElements;
        },
        error: err => {
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load components';
        }
      });
  }

  search(): void {
    this.page = 0;
    this.load();
  }

  reset(): void {
    this.q = '';
    this.componentType = '';
    this.status = '';
    this.page = 0;
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.dialogVisible = true;
  }

  openEdit(row: SalaryComponent): void {
    this.editing = row;
    this.dialogVisible = true;
  }

  toggleStatus(row: SalaryComponent): void {
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.confirm.confirm({
      message: `Set "${row.name}" to ${next}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.patchComponentStatus(row.salaryComponentId, next).subscribe({
          next: () => {
            this.feedback.success('Status updated', row.name);
            this.load();
          },
          error: err => this.feedback.error('Status change failed', extractApiError(err, 'Request failed').message)
        });
      }
    });
  }

  remove(row: SalaryComponent): void {
    this.confirm.confirm({
      message: `Delete "${row.name}"? Allowed only when unused.`,
      header: 'Delete Component',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deleteComponent(row.salaryComponentId).subscribe({
          next: () => {
            this.feedback.success('Deleted', row.name);
            this.load();
          },
          error: err => this.feedback.error('Delete failed', extractApiError(err, 'Request failed').message)
        });
      }
    });
  }
}
