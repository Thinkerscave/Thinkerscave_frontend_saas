import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { WorkspaceHeaderComponent } from '../../../../shared/components/workspace-header/workspace-header.component';
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
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        TooltipModule,
        WorkspaceHeaderComponent,
        StatusBadgeComponent,
        EmptyStateComponent,
        SkeletonComponent,
        KpiCardComponent
    ],
    templateUrl: './enrollment-list.component.html',
    styleUrl: './enrollment-list.component.scss'
})
export class EnrollmentListComponent implements OnInit {
    readonly router = inject(Router);
    private readonly service = inject(EnrollmentService);

    enrollments = signal<AcademicEnrollment[]>([]);
    loading = signal(false);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.service.list().subscribe({
            next: data => { this.enrollments.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
    }

    countBy(status: EnrollmentStatus): number {
        return this.enrollments().filter(e => e.status === status).length;
    }
}
