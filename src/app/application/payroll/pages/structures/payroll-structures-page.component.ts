import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { finalize } from 'rxjs';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { SalaryStructureDialogComponent } from '../../components/salary-structure-dialog/salary-structure-dialog.component';
import { PAYROLL_RESOURCES, SalaryStructure } from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';

@Component({
  selector: 'app-payroll-structures-page',
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
    SalaryStructureDialogComponent
  ],
  templateUrl: './payroll-structures-page.component.html',
  styleUrls: ['../../payroll.shared.scss', './payroll-structures-page.component.scss']
})
export class PayrollStructuresPageComponent implements OnInit {
  private readonly api = inject(PayrollApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly confirm = inject(ConfirmationService);

  readonly resources = PAYROLL_RESOURCES;
  rows: SalaryStructure[] = [];
  loading = true;
  error: string | null = null;
  q = '';
  status = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  dialogVisible = false;
  editing: SalaryStructure | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api
      .listStructures({ q: this.q || undefined, status: this.status || undefined }, this.page, this.size)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: page => {
          this.rows = page.content;
          this.total = page.totalElements;
        },
        error: err => {
          this.error = extractApiError(err, 'Request failed').message || 'Failed to load structures';
        }
      });
  }

  search(): void {
    this.page = 0;
    this.load();
  }

  reset(): void {
    this.q = '';
    this.status = '';
    this.page = 0;
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.dialogVisible = true;
  }

  openEdit(row: SalaryStructure): void {
    this.api.getStructure(row.salaryStructureId).subscribe({
      next: detail => {
        this.editing = detail;
        this.dialogVisible = true;
      },
      error: err => this.feedback.error('Load failed', extractApiError(err, 'Request failed').message)
    });
  }

  toggleStatus(row: SalaryStructure): void {
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.confirm.confirm({
      message: `Set "${row.name}" to ${next}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.patchStructureStatus(row.salaryStructureId, next).subscribe({
          next: () => {
            this.feedback.success('Status updated', row.name);
            this.load();
          },
          error: err => this.feedback.error('Status change failed', extractApiError(err, 'Request failed').message)
        });
      }
    });
  }

  remove(row: SalaryStructure): void {
    this.confirm.confirm({
      message: `Delete "${row.name}"?`,
      header: 'Delete Structure',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deleteStructure(row.salaryStructureId).subscribe({
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
