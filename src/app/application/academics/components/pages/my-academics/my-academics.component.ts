import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { ACADEMICS_MY_ACADEMICS_RESOURCE, StudentMyAcademics } from '../../../models/academics-me.model';

@Component({
  selector: 'app-my-academics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DropdownModule, SaasPageHeaderComponent],
  templateUrl: './my-academics.component.html',
  styleUrls: ['./my-academics.component.scss']
})
export class MyAcademicsPageComponent implements OnInit {
  private readonly api = inject(AcademicsMeApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_MY_ACADEMICS_RESOURCE;
  loading = true;
  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  data: StudentMyAcademics | null = null;

  ngOnInit(): void {
    this.yearApi.search(undefined, undefined, { skipErrorToast: true }).subscribe({
      next: (years) => {
        this.years = years;
        this.selectedYearId = (years.find((y) => y.status === 'CURRENT') ?? years[0])?.academicYearId ?? null;
        this.reload();
      },
      error: () => {
        this.years = [];
        this.selectedYearId = null;
        this.reload();
      }
    });
  }

  reload(): void {
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

  scrollToSubjects(event: Event): void {
    event.preventDefault();
    document.getElementById('ma-subjects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
