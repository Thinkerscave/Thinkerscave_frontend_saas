import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { environment } from '../../../../../environments/environment';
import { FeesApiService } from '../../services/fees-api.service';
import { CollectFeeDialogComponent } from '../../components/collect-fee-dialog/collect-fee-dialog.component';
import {
  FEES_RESOURCES,
  OutstandingItem,
  OutstandingSummary,
  StudentFeeListItem
} from '../../models/fees.model';

interface LookupOption { id: number; name: string; }

@Component({
  selector: 'app-fees-outstanding-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, HasPermissionDirective, AppToastComponent,
    CollectFeeDialogComponent, KpiCardComponent, KpiGroupComponent, SaasPageHeaderComponent,
    TcPageSkeletonComponent
  ],
  templateUrl: './fees-outstanding-page.component.html',
  styleUrls: ['./fees-outstanding-page.component.scss', '../../fees.shared.scss']
})
export class FeesOutstandingPageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly http = inject(HttpClient);

  readonly resources = FEES_RESOURCES;
  years: LookupOption[] = [];
  academicYearId: number | null = null;
  status = '';
  rows: OutstandingItem[] = [];
  summary: OutstandingSummary | null = null;
  loading = true;
  error: string | null = null;
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  collectVisible = false;
  collectStudent: StudentFeeListItem | null = null;

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/academic-years`)
      .pipe(map(r => r.data ?? []))
      .subscribe(years => {
        this.years = years;
        this.academicYearId = years[0]?.id ?? null;
        this.load();
      });
  }

  load(): void {
    if (this.academicYearId == null) return;
    this.loading = true;
    this.error = null;
    this.api.outstandingSummary(this.academicYearId).subscribe({
      next: s => this.summary = s,
      error: () => this.summary = null
    });
    this.api.listOutstanding({
      academicYearId: this.academicYearId,
      status: this.status || undefined
    }, this.page, this.size).pipe(finalizeBusy(v => (this.loading = v))).subscribe({
      next: page => {
        this.rows = page.content;
        this.total = page.totalElements;
      },
      error: err => {
        this.error = extractApiError(err, 'Request failed').message || 'Failed to load outstanding';
      }
    });
  }

  search(): void {
    this.page = 0;
    this.load();
  }

  openCollect(row: OutstandingItem): void {
    this.collectStudent = {
      studentId: row.studentId,
      studentName: row.studentName,
      admissionNumber: row.admissionNumber,
      className: row.className,
      sectionName: row.sectionName,
      totalFee: 0,
      paid: 0,
      outstanding: row.balanceAmount,
      canCollectFee: row.canCollectFee
    };
    this.collectVisible = true;
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if ((this.page + 1) * this.size >= this.total) return;
    this.page += 1;
    this.load();
  }
}
