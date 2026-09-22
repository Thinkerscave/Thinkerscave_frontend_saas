import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { AcademicEnrollment, EnrollmentService, EnrollmentStatus } from '../../services/enrollment.service';

/**
 * Lists academic enrollments with status KPIs.
 * Drives row-level editing via the router.
 */
@Component({
    selector: 'app-enrollment-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        TooltipModule,
        SaasPageHeaderComponent,
        TcAcademicYearSelectorComponent,
        StatusBadgeComponent,
        EmptyStateComponent,
        SkeletonComponent,
        KpiCardComponent
    ],
    templateUrl: './enrollment-list.component.html',
    styleUrl: './enrollment-list.component.scss'
})
export class EnrollmentListComponent {
    readonly router = inject(Router);
    private readonly service = inject(EnrollmentService);

    enrollments = signal<AcademicEnrollment[]>([]);
    loading = signal(false);
    selectedYearId: number | null = null;

    onAcademicYearChange(yearId: number | null): void {
        this.selectedYearId = yearId;
        if (yearId == null) {
            this.enrollments.set([]);
            this.loading.set(false);
            return;
        }
        this.load();
    }

    load(): void {
        if (!this.selectedYearId) return;
        this.loading.set(true);
        this.service.list(this.selectedYearId).subscribe({
            next: data => { this.enrollments.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
    }

    countBy(status: EnrollmentStatus): number {
        return this.enrollments().filter(e => e.status === status).length;
    }
}
