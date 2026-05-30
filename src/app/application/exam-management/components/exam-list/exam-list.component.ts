import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal , ChangeDetectionStrategy} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { WorkspaceHeaderComponent } from '../../../../shared/components/workspace-header/workspace-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { Exam, ExamService } from '../../services/exam.service';

/**
 * Lists scheduled, in-progress and published exams with a KPI summary strip.
 * Row actions deep-link to the exam edit, marks-entry and results pages.
 */
@Component({
    selector: 'app-exam-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        ButtonModule,
        TableModule,
        TagModule,
        TooltipModule,
        WorkspaceHeaderComponent,
        StatusBadgeComponent,
        EmptyStateComponent,
        SkeletonComponent,
        KpiCardComponent
    ],
    templateUrl: './exam-list.component.html',
    styleUrl: './exam-list.component.scss'
})
export class ExamListComponent implements OnInit {
    readonly router = inject(Router);
    private readonly service = inject(ExamService);

    exams = signal<Exam[]>([]);
    loading = signal(false);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.service.listExams().subscribe({
            next: data => { this.exams.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
    }

    countBy(status: Exam['status']): number {
        return this.exams().filter(e => e.status === status).length;
    }
}
