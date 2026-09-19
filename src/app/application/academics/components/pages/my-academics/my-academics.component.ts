import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { ACADEMICS_MY_ACADEMICS_RESOURCE, StudentMyAcademics } from '../../../models/academics-me.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-my-academics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, SaasPageHeaderComponent, TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './my-academics.component.html',
  styleUrls: ['./my-academics.component.scss']
})
export class MyAcademicsPageComponent {
  private readonly api = inject(AcademicsMeApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_MY_ACADEMICS_RESOURCE;
  loading = true;
  selectedYearId: number | null = null;
  data: StudentMyAcademics | null = null;

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (yearId == null) {
      this.data = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    this.loading = true;
    this.api.myAcademics(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (d) => this.data = d,
        error: (err) => this.messages.add({ severity: 'error', summary: 'Unable to load academics', detail: err?.error?.message })
      });
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
  }
}
