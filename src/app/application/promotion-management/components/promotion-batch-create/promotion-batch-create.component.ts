import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

import { WorkspaceHeaderComponent } from '../../../../shared/components/workspace-header/workspace-header.component';
import { StudentsWorkspaceService } from '../../../students/services/students-workspace.service';
import { PromotionService } from '../../services/promotion.service';

@Component({
  selector: 'app-promotion-batch-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputTextarea,
    WorkspaceHeaderComponent
  ],
  templateUrl: './promotion-batch-create.component.html',
  styleUrl: './promotion-batch-create.component.scss'
})
export class PromotionBatchCreateComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly promotionApi = inject(PromotionService);
  private readonly studentsApi = inject(StudentsWorkspaceService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  years: { label: string; value: number }[] = [];
  fromAcademicYearId: number | null = null;
  toAcademicYearId: number | null = null;
  batchCode = '';
  remarks = '';
  saving = false;
  loadingYears = true;

  ngOnInit(): void {
    this.studentsApi.listAcademicYears().pipe(
      finalize(() => { this.loadingYears = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: list => {
        this.years = list.map(y => ({ label: y.label, value: y.id }));
        if (this.years.length >= 2) {
          this.fromAcademicYearId = this.years[0].value;
          this.toAcademicYearId = this.years[1].value;
        } else if (this.years.length === 1) {
          this.fromAcademicYearId = this.years[0].value;
        }
      },
      error: () => {
        this.messages.add({ severity: 'error', summary: 'Promotions', detail: 'Unable to load academic years' });
      }
    });
  }

  submit(): void {
    if (!this.fromAcademicYearId || !this.toAcademicYearId) {
      this.messages.add({ severity: 'warn', summary: 'Promotions', detail: 'Select from and to academic years' });
      return;
    }
    if (this.fromAcademicYearId === this.toAcademicYearId) {
      this.messages.add({ severity: 'warn', summary: 'Promotions', detail: 'From and To years must differ' });
      return;
    }
    this.saving = true;
    this.promotionApi.createBatch({
      fromAcademicYearId: this.fromAcademicYearId,
      toAcademicYearId: this.toAcademicYearId,
      batchCode: this.batchCode?.trim() || undefined,
      remarks: this.remarks?.trim() || undefined
    }).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Promotions', detail: 'Draft batch created' });
        void this.router.navigate(['/app/promotions']);
      },
      error: err => {
        this.messages.add({
          severity: 'error',
          summary: 'Promotions',
          detail: err?.error?.message || 'Unable to create batch'
        });
      }
    });
  }

  cancel(): void {
    void this.router.navigate(['/app/promotions']);
  }
}
