import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { WorkspaceHeaderComponent } from '../../../../shared/components/workspace-header/workspace-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { CommunicationService, Notice, NoticeStatus } from '../../services/communication.service';

/**
 * Lists notices with status KPIs and lifecycle transitions
 * (DRAFT → PUBLISHED → ARCHIVED). Confirms destructive moves via PrimeNG dialog.
 */
@Component({
    selector: 'app-notice-list',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        TooltipModule,
        ConfirmDialogModule,
        WorkspaceHeaderComponent,
        StatusBadgeComponent,
        EmptyStateComponent,
        SkeletonComponent,
        KpiCardComponent
    ],
    providers: [ConfirmationService],
    templateUrl: './notice-list.component.html',
    styleUrl: './notice-list.component.scss'
})
export class NoticeListComponent implements OnInit {
    readonly router = inject(Router);
    private readonly service = inject(CommunicationService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    notices = signal<Notice[]>([]);
    loading = signal(false);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.service.listNotices().subscribe({
            next: data => { this.notices.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
    }

    countBy(status: NoticeStatus): number {
        return this.notices().filter(n => n.status === status).length;
    }

    transition(notice: Notice, target: NoticeStatus): void {
        this.confirmationService.confirm({
            header: target === 'PUBLISHED' ? 'Publish notice?' : 'Archive notice?',
            message: `Are you sure you want to ${target.toLowerCase()} "${notice.title}"?`,
            icon: 'pi pi-question-circle',
            accept: () => {
                this.service.transitionNotice(notice.id, target).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Notice updated',
                            detail: `${notice.title} is now ${target.toLowerCase()}.`
                        });
                        this.load();
                    }
                });
            }
        });
    }
}
